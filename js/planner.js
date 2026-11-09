/**
 * DOLANESIA - Smart Itinerary Generator Engine
 * Merancang jadwal liburan Solo Raya otomatis, cerdas, realistis, dan efisien per jam.
 * Mendukung filter durasi (1-5 hari), kategori minat, budget tier, moda transportasi,
 * serta perancangan cerdas langsung dari keranjang pilihan pengguna (Cart-to-Itinerary).
 */

class DolanesiaPlanner {
  constructor(destinations = []) {
    this.destinations = destinations;
  }

  setDestinations(destinations) {
    this.destinations = destinations;
  }

  /**
   * Main entry point for generating itineraries
   * @param {Object} params - { duration, interest, budgetTier, transport, fromCart, cartItems }
   */
  generateItinerary(params = {}) {
    const {
      duration = 1,
      interest = 'all',
      budgetTier = 'standard',
      transport = 'motor',
      fromCart = false,
      cartItems = []
    } = params;

    const daysCount = Math.max(1, Math.min(5, parseInt(duration, 10) || 1));

    // If generating specifically from user's custom cart
    if (fromCart && Array.isArray(cartItems) && cartItems.length > 0) {
      return this.generateFromCart(cartItems, {
        duration: daysCount,
        budgetTier,
        transport
      });
    }

    // Otherwise, generate algorithmic smart itinerary based on interest & budget
    const itinerary = [];
    const usedIds = new Set();

    for (let day = 1; day <= daysCount; day++) {
      const dayPlan = this.buildCuratedDayPlan(day, daysCount, interest, budgetTier, usedIds);
      itinerary.push(dayPlan);
    }

    const totalBudget = itinerary.reduce((sum, d) => sum + d.dayTotalCost, 0);

    return {
      isFromCart: false,
      days: itinerary,
      totalBudget,
      budgetTier,
      transportAdvice: this.getTransportAdvice(transport, daysCount),
      summaryText: this.buildSummaryText(daysCount, interest, budgetTier)
    };
  }

  /**
   * Generate intelligent itinerary from user's custom saved items (Cart)
   */
  generateFromCart(cartItems, options = {}) {
    const { budgetTier = 'standard', transport = 'motor' } = options;
    const items = [...cartItems];
    const totalItems = items.length;

    // Determine optimal days count based on items count
    let daysCount = options.duration;
    if (!daysCount || daysCount < 1) {
      daysCount = totalItems <= 4 ? 1 : (totalItems <= 8 ? 2 : 3);
    }
    daysCount = Math.min(daysCount, Math.max(1, Math.ceil(totalItems / 2)));

    // Cluster items: group Downtown Solo vs Karanganyar vs Boyolali / Klaten
    const clusterOutlying = items.filter(d => 
      d.region.includes('Karanganyar') || d.region.includes('Boyolali') || d.region.includes('Klaten')
    );
    const clusterDowntown = items.filter(d => !clusterOutlying.includes(d));

    // Distribute into days
    const dayBuckets = Array.from({ length: daysCount }, () => []);

    if (daysCount === 1) {
      dayBuckets[0] = items;
    } else if (daysCount >= 2 && clusterOutlying.length > 0 && clusterDowntown.length > 0) {
      // Day 1 gets downtown, Day 2 gets mountain/nature outlying
      dayBuckets[0] = clusterDowntown;
      dayBuckets[1] = clusterOutlying;
    } else {
      // Even distribution
      items.forEach((item, idx) => {
        const bucketIdx = idx % daysCount;
        dayBuckets[bucketIdx].push(item);
      });
    }

    const multiplier = budgetTier === 'budget' ? 0.85 : (budgetTier === 'comfort' ? 1.35 : 1.0);
    const itinerary = [];

    dayBuckets.forEach((bucketItems, dayIdx) => {
      const dayNumber = dayIdx + 1;
      const slots = [];
      let dayTotalCost = 0;

      // Sort items within day chronologically by category / type
      const sortedItems = [...bucketItems].sort((a, b) => {
        const order = { culinary: 1, culture: 2, shopping: 3, nature: 2 };
        return (order[a.category] || 2) - (order[b.category] || 2);
      });

      const timeSchedules = [
        { time: '08.00 - 10.00', title: 'Destinasi Pilihan Pagi' },
        { time: '10.30 - 12.30', title: 'Eksplorasi Siang' },
        { time: '13.00 - 15.00', title: 'Santap Siang & Relaksasi' },
        { time: '15.30 - 17.30', title: 'Kunjungan Sore' },
        { time: '18.30 - 21.00', title: 'Kuliner & Suasana Malam' }
      ];

      sortedItems.forEach((item, sIdx) => {
        const schedule = timeSchedules[sIdx] || {
          time: `${14 + sIdx}.00 - ${16 + sIdx}.00`,
          title: `Agenda Pilihan ${sIdx + 1}`
        };

        const estimatedCost = Math.round(((item.priceNumeric || 25000) * multiplier) / 5000) * 5000;
        dayTotalCost += estimatedCost;

        slots.push({
          time: schedule.time,
          title: item.categoryName || schedule.title,
          item,
          note: item.localTip || `Destinasi favorit Anda di ${item.region}.`,
          estimatedCost
        });
      });

      // If user selected only 1 or 2 items, round out with iconic local meal complement
      if (slots.length < 3) {
        const hasBreakfast = slots.some(s => s.item.category === 'culinary');
        if (!hasBreakfast) {
          const complement = this.getSpotById('pasar-gede') || this.getSpotByCategory('culinary');
          if (complement) {
            const cost = Math.round((complement.priceNumeric * multiplier) / 5000) * 5000;
            dayTotalCost += cost;
            slots.unshift({
              time: '07.30 - 09.00',
              title: 'Rekomendasi Sarapan Wong Solo',
              item: complement,
              note: 'Pelengkap rute: sarapan Es Dawet Telasih legendaris sebelum memulai perjalanan Anda.',
              estimatedCost: cost
            });
          }
        }
      }

      itinerary.push({
        dayNumber,
        themeTitle: `Jadwal Khusus Hari ke-${dayNumber} (Pilihan Keranjang Anda)`,
        slots,
        dayTotalCost
      });
    });

    const totalBudget = itinerary.reduce((sum, d) => sum + d.dayTotalCost, 0);

    return {
      isFromCart: true,
      days: itinerary,
      totalBudget,
      budgetTier,
      transportAdvice: this.getTransportAdvice(transport, daysCount),
      summaryText: `Itinerary terstruktur otomatis khusus dari ${totalItems} destinasi yang Anda simpan di keranjang, dioptimalkan untuk liburan ${daysCount} hari tanpa rute bolak-balik.`
    };
  }

  /**
   * Builds an algorithmic curated day plan with category awareness & realistic sequencing
   */
  buildCuratedDayPlan(dayNumber, totalDays, interest, budgetTier, usedIds) {
    const slots = [];
    let dayTotalCost = 0;
    let themeTitle = '';

    const multiplier = budgetTier === 'budget' ? 0.8 : (budgetTier === 'comfort' ? 1.4 : 1.0);

    // Helpers to find and claim spots to avoid exact duplicates
    const claim = (idOrPredicate) => {
      let spot;
      if (typeof idOrPredicate === 'string') {
        spot = this.destinations.find(d => d.id === idOrPredicate);
      } else {
        spot = this.destinations.find(d => !usedIds.has(d.id) && idOrPredicate(d)) || 
               this.destinations.find(idOrPredicate);
      }
      if (spot) usedIds.add(spot.id);
      return spot || this.destinations[0];
    };

    // =========================================================================
    // BRANCH A: KULINER OTENTIK LEGENDARIS (culinary)
    // =========================================================================
    if (interest === 'culinary') {
      if (dayNumber === 1) {
        themeTitle = 'Pusaka Kuliner Pasar Gede, Rempah Klewer & Malam Keprabon';
        slots.push(
          {
            time: '07.30 - 09.30',
            title: 'Sarapan Jajanan Pasar & Es Dawet Telasih',
            item: claim('pasar-gede'),
            note: 'Cicipi Es Dawet Telasih Bu Dermi dengan santan segar dan Lenjongan ketan hitam manis.'
          },
          {
            time: '10.00 - 11.30',
            title: 'Kunjungan Arsitektur Megah & Foto Santai',
            item: claim('zayed-mosque'),
            note: 'Jalan santai di pelataran marmer putih sembari memberi jeda sebelum makan siang rempah.'
          },
          {
            time: '12.00 - 13.30',
            title: 'Makan Siang Tengkleng Kambing Pincuk Legendaris',
            item: claim('tengkleng-bu-edi'),
            note: 'Sensasi menyesap sumsum tulang kambing berkuah kuning gurih beralas daun pisang.'
          },
          {
            time: '14.30 - 16.00',
            title: 'Jelajah Harta Vintage & Kafe Tempo Dulu',
            item: claim('pasar-triwindu'),
            note: 'Hunting cangkir enamel seng antik dan jalan kaki di selasar koridor seni Ngarsopuro.'
          },
          {
            time: '16.30 - 18.00',
            title: 'Camilan Pusaka Solo Hangat Sejak 1923',
            item: claim('serabi-notosuman'),
            note: 'Nikmati serabi gulung cokelat yang baru matang langsung dari wajan tanah liat.'
          },
          {
            time: '19.00 - 21.00',
            title: 'Santap Malam Lesehan & Gending Siter Jawa',
            item: claim('nasi-liwet-wongso-lemu'),
            note: 'Nasi liwet gurih beraroma pandan dengan areh santan kental dan sayur labu siam pedas.'
          }
        );
      } else if (dayNumber === 2) {
        themeTitle = 'Soto Langganan Presiden & Selat Bistik Eropa-Jawa';
        slots.push(
          {
            time: '07.30 - 09.00',
            title: 'Sarapan Soto Bening Favorit Presiden RI',
            item: claim('soto-gading-1'),
            note: 'Awali pagi dengan kaldu ayam kampung bening gurih, sate puyuh, dan sosis Solo basah.'
          },
          {
            time: '09.30 - 11.30',
            title: 'Istana Kadipaten & Keindahan Taman Pracima',
            item: claim('pura-mangkunegaran'),
            note: 'Jelajah arsitektur Jawa-Eropa dan cicipi minuman rempah khas pangeran di Pracima Tuin.'
          },
          {
            time: '12.00 - 13.30',
            title: 'Santap Siang Bistik Selat Solo Estetik',
            item: claim('selat-solo-mbak-lies'),
            note: 'Perpaduan bistik daging sapi segar dengan saus manis Jawa dan interior keramik antik.'
          },
          {
            time: '14.00 - 16.30',
            title: 'Gang Kuno Saudagar & Kopi Tradisional',
            item: claim('kampung-batik-laweyan'),
            note: 'Menyusuri lorong dinding tinggi berdinding putih sambil ngopi di galeri batik kuno.'
          },
          {
            time: '17.30 - 20.00',
            title: 'Wisata Industrial Pabrik Gula & Kafe Besali',
            item: claim('de-tjolomadoe'),
            note: 'Mencicipi kopi di Besali Cafe dengan pemandangan mesin giling tebu raksasa era kolonial 1861.'
          }
        );
      } else {
        themeTitle = 'Petualangan Rasa & Udara Sejuk Lereng Lawu';
        slots.push(
          {
            time: '07.00 - 11.30',
            title: 'Tea Walk Kebun Teh & Seduhan Teh Daun Segar',
            item: claim('candi-cetho-kemuning'),
            note: 'Hirup segarnya hawa sejuk Lereng Lawu dan cicipi teh hijau Kemuning di tea house lereng candi.'
          },
          {
            time: '12.30 - 14.30',
            title: 'Makan Siang Berhadapan Satwa di Makunde Bistro',
            item: claim('solo-safari'),
            note: 'Pengalaman unik santap siang lezat di restoran Makunde Bistro sambil menatap singa di habitat terbuka.'
          },
          {
            time: '15.30 - 18.00',
            title: 'Napak Tilas Jantung Keraton Kasunanan',
            item: claim('keraton-surakarta'),
            note: 'Saksikan pusaka kerajaan Mataram Islam sebelum menutup petualangan rasa Solo Raya.'
          }
        );
      }
    }

    // =========================================================================
    // BRANCH B: SEJARAH & BUDAYA (culture)
    // =========================================================================
    else if (interest === 'culture') {
      if (dayNumber === 1) {
        themeTitle = 'Mahakarya Religi, Dinasti Mangkunegaran & Kuliner Pusaka';
        slots.push(
          {
            time: '07.30 - 09.00',
            title: 'Sarapan Tradisional Pagi Wong Solo',
            item: claim('pasar-gede'),
            note: 'Mengenal pasar tertua rancangan Thomas Karsten tahun 1930 dan sarapan es dawet telasih.'
          },
          {
            time: '09.30 - 11.30',
            title: 'Arsitektur Marmer Megah Sheikh Zayed',
            item: claim('zayed-mosque'),
            note: 'Mengagumi detail kubah emas, kaligrafi Islam, dan lantai marmer putih Carrara Italia.'
          },
          {
            time: '12.00 - 13.30',
            title: 'Makan Siang Selat Tradisi Eropa-Jawa',
            item: claim('selat-solo-mbak-lies'),
            note: 'Menikmati kuliner bistik akulturasi budaya kolonial Belanda dan priyayi Jawa.'
          },
          {
            time: '14.00 - 16.30',
            title: 'Eksplorasi Kadipaten Pura Mangkunegaran & Pracima Tuin',
            item: claim('pura-mangkunegaran'),
            note: 'Museum pusaka gamelan Kyai Kanyut Mesem, perhiasan emas, dan taman kerajaan Pracima.'
          },
          {
            time: '17.00 - 18.30',
            title: 'Camilan Pusaka Tradisional Solo',
            item: claim('serabi-notosuman'),
            note: 'Camilan pusaka sejak 1923 berbahan tepung beras asli yang dimasak dengan arang.'
          },
          {
            time: '19.00 - 21.00',
            title: 'Kuliner Malam Bersejarah Nasi Liwet Keprabon',
            item: claim('nasi-liwet-wongso-lemu'),
            note: 'Tradisi makan malam lesehan di koridor Keprabon yang sudah melegenda sejak 1950.'
          }
        );
      } else if (dayNumber === 2) {
        themeTitle = 'Napak Tilas Jantung Keraton Surakarta & Kampung Saudagar';
        slots.push(
          {
            time: '07.30 - 09.00',
            title: 'Sarapan Soto Bening Favorit Negarawan',
            item: claim('soto-gading-1'),
            note: 'Sarapan soto legendaris di dekat gapura Alun-alun Kidul.'
          },
          {
            time: '09.00 - 11.30',
            title: 'Keraton Kasunanan Surakarta Hadiningrat',
            item: claim('keraton-surakarta'),
            note: 'Menatap panggung Songgobuwono, pasir laut selatan Parangkusumo, dan museum kereta kencana.'
          },
          {
            time: '12.00 - 13.30',
            title: 'Makan Siang Tengkleng Pasar Klewer',
            item: claim('tengkleng-bu-edi'),
            note: 'Menikmati kuliner rakyat Solo berkuah rempah gurih di bawah gapura Pasar Klewer.'
          },
          {
            time: '14.00 - 16.30',
            title: 'Kampung Kuno Saudagar Batik Laweyan',
            item: claim('kampung-batik-laweyan'),
            note: 'Menyusuri gang kuno bernuansa art nouveau saksi sejarah lahirnya Sarekat Islam 1911.'
          },
          {
            time: '17.00 - 19.30',
            title: 'Pasar Antik Triwindu & Koridor Budaya Ngarsopuro',
            item: claim('pasar-triwindu'),
            note: 'Pasar antik bersejarah hadiah ulang tahun tahta Mangkunegara VII tahun 1939.'
          }
        );
      } else {
        themeTitle = 'Pabrik Gula Abad 19 & Punden Berundak Candi Lereng Lawu';
        slots.push(
          {
            time: '07.30 - 11.30',
            title: 'Candi Hindu Abad ke-15 di Atas Awan',
            item: claim('candi-cetho-kemuning'),
            note: 'Menyaksikan punden berundak megah berlatar kabut Gunung Lawu yang bernuansa magis.'
          },
          {
            time: '12.30 - 14.00',
            title: 'Makan Siang Teh & Hidangan Lereng Lawu',
            item: claim('solo-safari'),
            note: 'Relaksasi santai dan menikmati keindahan alam Solo Raya.'
          },
          {
            time: '14.30 - 17.30',
            title: 'Pusat Sejarah Industri De Tjolomadoe 1861',
            item: claim('de-tjolomadoe'),
            note: 'Karya visioner Mangkunegara IV yang pernah menjadi pabrik gula terbesar di Asia Tenggara.'
          }
        );
      }
    }

    // =========================================================================
    // BRANCH C: BELANJA & BATIK (shopping)
    // =========================================================================
    else if (interest === 'shopping') {
      if (dayNumber === 1) {
        themeTitle = 'Surganya Batik Kuno, Oleh-Oleh Pusaka & Pasar Gede';
        slots.push(
          {
            time: '07.30 - 09.30',
            title: 'Belanja Jajanan Pasar & Oleh-Oleh Rempah Tradisional',
            item: claim('pasar-gede'),
            note: 'Beli teh tubruk oplosan khas Solo (Nasgitel), intip goreng, brem, dan sarapan dawet.'
          },
          {
            time: '10.00 - 12.30',
            title: 'Belanja Kain Batik di Pasar Klewer & PGS',
            item: claim('tengkleng-bu-edi'),
            note: 'Berburu kain batik cap dan tulis di Pasar Klewer lalu makan siang tengkleng legendaris.'
          },
          {
            time: '13.30 - 16.00',
            title: 'Hunting Batik Tulis Halus & Workshop Canting Laweyan',
            item: claim('kampung-batik-laweyan'),
            note: 'Masuk ke galeri-galeri rumahan saudagar batik, belajar mencanting, dan membeli batik truntum.'
          },
          {
            time: '16.30 - 18.00',
            title: 'Bawa Pulang Serabi Notosuman Fresh Box',
            item: claim('serabi-notosuman'),
            note: 'Pesan kardus oleh-oleh serabi gulung cokelat dan putih gurih untuk keluarga di rumah.'
          },
          {
            time: '19.00 - 21.00',
            title: 'Makan Malam Kuliner Malam Solo Lesehan',
            item: claim('nasi-liwet-wongso-lemu'),
            note: 'Istirahat santai sambil menikmati nasi liwet gurih santan di pusat kuliner malam.'
          }
        );
      } else if (dayNumber === 2) {
        themeTitle = 'Berburu Harta Karun Vintage, Cinderamata Keraton & Seni';
        slots.push(
          {
            time: '08.30 - 10.30',
            title: 'Suvenir & Kerajinan Keraton Kasunanan',
            item: claim('keraton-surakarta'),
            note: 'Melihat cinderamata batik sogan klasik dan ornamen wayang kulit asli Solo.'
          },
          {
            time: '11.00 - 12.30',
            title: 'Santap Siang Selat Solo Estetik',
            item: claim('selat-solo-mbak-lies'),
            note: 'Makan siang sembari menikmati koleksi keramik antik yang menghiasi seluruh ruang makan.'
          },
          {
            time: '13.00 - 16.30',
            title: 'Hunting Barang Antik & Vintage di Pasar Triwindu',
            item: claim('pasar-triwindu'),
            note: 'Menawar koin kuno VOC, kamera analog, radio tabung, piring antik, dan patung loro blonyo.'
          },
          {
            time: '17.00 - 19.30',
            title: 'Pusat Kerajinan & Suvenir Heritage De Tjolomadoe',
            item: claim('de-tjolomadoe'),
            note: 'Beli cinderamata bertema industrial retro dan kopi artisan kemasan eksklusif.'
          }
        );
      } else {
        themeTitle = 'Oleh-Oleh Khas Dataran Tinggi & Rekreasi Satwa';
        slots.push(
          {
            time: '07.30 - 09.00',
            title: 'Sarapan Soto Gading 1 Solo',
            item: claim('soto-gading-1'),
            note: 'Sarapan segar berenergi sebelum hunting oleh-oleh dataran tinggi Solo Raya.'
          },
          {
            time: '09.30 - 12.30',
            title: 'Solo Safari & Galeri Cinderamata Edukasi',
            item: claim('solo-safari'),
            note: 'Beli boneka satwa lucu ramah anak dan suvenir konservasi lingkungan.'
          },
          {
            time: '13.30 - 17.00',
            title: 'Belanja Teh Daun Kemuning Asli di Lereng Lawu',
            item: claim('candi-cetho-kemuning'),
            note: 'Borong teh hijau putih (white tea) Kemuning dan madu hutan murni Lereng Lawu.'
          }
        );
      }
    }

    // =========================================================================
    // BRANCH D: ALAM & HEALING (nature)
    // =========================================================================
    else if (interest === 'nature') {
      if (dayNumber === 1) {
        themeTitle = 'Healing Satwa Modern Solo Safari & Hawa Sejuk Religi';
        slots.push(
          {
            time: '07.30 - 09.00',
            title: 'Sarapan Soto Ayam Kuah Bening Segar',
            item: claim('soto-gading-1'),
            note: 'Awali pagi yang segar dengan kuah kaldu hangat khas Solo.'
          },
          {
            time: '09.30 - 13.30',
            title: 'Petualangan Satwa Alam Terbuka Solo Safari',
            item: claim('solo-safari'),
            note: 'Jelajah Safari Journey tanpa kandang jeruji, interaksi satwa, dan makan siang di Makunde Bistro.'
          },
          {
            time: '14.30 - 16.30',
            title: 'Wisata Spiritual & Arsitektur Terbuka Sheikh Zayed',
            item: claim('zayed-mosque'),
            note: 'Duduk santai di selasar marmer terbuka beratap kubah megah saat semilir angin sore.'
          },
          {
            time: '17.30 - 19.30',
            title: 'Santap Malam Selat Bistik Segar',
            item: claim('selat-solo-mbak-lies'),
            note: 'Segarnya kuah selat solo dengan aneka sayuran rebus buncis, wortel, dan kentang renyah.'
          }
        );
      } else if (dayNumber === 2) {
        themeTitle = 'Negeri di Atas Awan Candi Cetho & Kebun Teh Kemuning';
        slots.push(
          {
            time: '06.30 - 11.30',
            title: 'Sunrise Kabut Lereng Lawu di Candi Cetho',
            item: claim('candi-cetho-kemuning'),
            note: 'Berdiri di gapura punden berundak 1.496 mdpl menembus awan dan tea walk di kebun teh hijau.'
          },
          {
            time: '12.30 - 14.30',
            title: 'Makan Siang & Seduhan Teh Hangat Lereng Gunung',
            item: claim('de-tjolomadoe'),
            note: 'Menikmati teh seduh Kemuning dan santai di area taman terbuka heritage De Tjolomadoe.'
          },
          {
            time: '16.00 - 18.00',
            title: 'Kudapan Sore Serabi Notosuman Tradisional',
            item: claim('serabi-notosuman'),
            note: 'Menikmati serabi hangat sepulang dari dinginnya dataran tinggi Karanganyar.'
          },
          {
            time: '19.00 - 21.00',
            title: 'Kuliner Malam Lesehan Tradisional',
            item: claim('nasi-liwet-wongso-lemu'),
            note: 'Makan malam hangat nasi liwet dengan taburan areh santan gurih.'
          }
        );
      } else {
        themeTitle = 'Mata Air Bening Ponggok & Pemandangan Megah Merapi Selo';
        slots.push(
          {
            time: '07.30 - 11.30',
            title: 'Snorkeling Air Tawar Bening Umbul Ponggok Klaten',
            item: claim('umbul-ponggok-klaten'),
            note: 'Berenang di kolam mata air alami berpasir putih bersama ratusan ikan air tawar.'
          },
          {
            time: '12.30 - 14.00',
            title: 'Makan Siang Kuliner Rempah Wong Solo',
            item: claim('tengkleng-bu-edi'),
            note: 'Mengisi tenaga dengan tengkleng rempah kambing legendaris Solo.'
          },
          {
            time: '14.30 - 17.30',
            title: 'Menatap Puncak Merapi & Susu Murni Boyolali di New Selo',
            item: claim('new-selo-boyolali'),
            note: 'Melihat pemandangan Gunung Merapi dan Merbabu sambil menyeruput susu segar Boyolali.'
          }
        );
      }
    }

    // =========================================================================
    // BRANCH E: CAMPURAN TERBAIK ALL-IN-ONE (all)
    // =========================================================================
    else {
      if (dayNumber === 1) {
        themeTitle = 'Pesona Ikonik Kota Solo & Kuliner Pusaka Legendaris';
        slots.push(
          {
            time: '07.30 - 09.00',
            title: 'Sarapan Jajanan Pasar & Dawet Telasih Tradisional',
            item: claim('pasar-gede'),
            note: 'Cicipi Es Dawet Telasih Bu Dermi dan sarapan Lenjongan ketan hitam khas Solo.'
          },
          {
            time: '09.30 - 11.30',
            title: 'Wisata Religi & Arsitektur Megah Sheikh Zayed',
            item: claim('zayed-mosque'),
            note: 'Foto-foto di koridor marmer putih Carrara Italia dan nikmati hawa sejuk pelataran kubah emas.'
          },
          {
            time: '12.00 - 13.30',
            title: 'Makan Siang Autentik Tengkleng Rempah Klewer',
            item: (budgetTier === 'budget' ? claim('soto-gading-1') : claim('tengkleng-bu-edi')),
            note: 'Nikmati kuah rempah kuning gurih dengan sensasi menyesap sumsum tulang kambing.'
          },
          {
            time: '14.00 - 16.00',
            title: 'Menjelajah Istana Heritage Pura Mangkunegaran & Pracima Tuin',
            item: claim('pura-mangkunegaran'),
            note: 'Jelajah taman Pracima Tuin bergaya Eropa-Jawa dan museum pusaka bersejarah kerajaan.'
          },
          {
            time: '16.30 - 18.00',
            title: 'Berburu Camilan Pusaka Serabi Hangat 1923',
            item: claim('serabi-notosuman'),
            note: 'Bawa serabi gulung cokelat yang baru matang langsung dari wajan tanah liat tradisional.'
          },
          {
            time: '19.00 - 21.00',
            title: 'Kuliner Malam Lesehan Nasi Liwet & Alunan Gending Siter',
            item: claim('nasi-liwet-wongso-lemu'),
            note: 'Santap nasi liwet gurih santan dengan alunan gending siter malam di jalan Teuku Umar.'
          }
        );
      } else if (dayNumber === 2) {
        themeTitle = 'Jejak Kerajaan Mataram, Batik Heritage & Harta Vintage';
        slots.push(
          {
            time: '08.30 - 11.30',
            title: 'Napak Tilas Jantung Kasunanan Surakarta Hadiningrat',
            item: claim('keraton-surakarta'),
            note: 'Pelajari filosofi pasir Parangkusumo laut selatan dan saksikan koleksi kereta kencana.'
          },
          {
            time: '12.00 - 13.30',
            title: 'Santap Siang Selat Solo Mbak Lies Serengan',
            item: claim('selat-solo-mbak-lies'),
            note: 'Makan bistik daging segar sembari menikmati dekorasi ribuan keramik antik Eropa.'
          },
          {
            time: '14.00 - 16.30',
            title: 'Eksplorasi Gang Kuno Saudagar Kampung Batik Laweyan',
            item: claim('kampung-batik-laweyan'),
            note: 'Belajar membatik dengan canting atau foto di lorong dinding tinggi tempo dulu.'
          },
          {
            time: '16.45 - 18.30',
            title: 'Berburu Harta Karun Vintage di Pasar Triwindu',
            item: claim('pasar-triwindu'),
            note: 'Beli suvenir antik koin zaman Hindia Belanda, kamera film analog, atau ornamen wayang.'
          }
        );
      } else {
        themeTitle = 'Petualangan Alam Lereng Lawu & Rekreasi Satwa Modern';
        slots.push(
          {
            time: '07.30 - 09.00',
            title: 'Sarapan Soto Ayam Kuah Bening Langganan Presiden',
            item: claim('soto-gading-1'),
            note: 'Awali pagi dengan kuah kaldu ayam gurih segar dan aneka sate telur puyuh.'
          },
          {
            time: '09.30 - 13.00',
            title: 'Petualangan Edukasi Satwa Solo Safari Zoo Modern',
            item: claim('solo-safari'),
            note: 'Saksikan satwa di habitat alami terbuka dan makan siang berhadapan dengan singa.'
          },
          {
            time: '14.00 - 17.00',
            title: 'Pabrik Gula Era Kolonial De Tjolomadoe 1861',
            item: claim('de-tjolomadoe'),
            note: 'Spot foto instagramable dengan mesin giling uap raksasa dan beli cinderamata khas.'
          }
        );
      }
    }

    // Calculate cost multiplier for budget tier
    slots.forEach(slot => {
      const baseCost = slot.item.priceNumeric || 20000;
      const estimatedCost = Math.round((baseCost * multiplier) / 5000) * 5000;
      slot.estimatedCost = estimatedCost;
      dayTotalCost += estimatedCost;
    });

    return {
      dayNumber,
      themeTitle,
      slots,
      dayTotalCost
    };
  }

  getSpotById(id) {
    return this.destinations.find(d => d.id === id);
  }

  getSpotByCategory(cat) {
    return this.destinations.find(d => d.category === cat);
  }

  getTransportAdvice(transport, days) {
    switch (transport) {
      case 'bst':
        return {
          mode: 'Batik Solo Trans (BST) & Feeder Publik',
          costNote: 'Gratis / Sangat Murah (Cukup Tap Kartu E-Money / QRIS)',
          tip: 'Unduh aplikasi Teman Bus di Android/iOS untuk melihat posisi real-time bus Koridor 1 (Bandara Adi Soemarmo - Palur via Slamet Riyadi) dan Koridor 2. Feeder siap mengantar hingga depan Pasar Gede dan Triwindu.'
        };
      case 'motor':
        return {
          mode: 'Sewa Motor / Ojek Online',
          costNote: 'Estimasi Rp 70.000 - Rp 90.000 / hari (Sewa)',
          tip: 'Pilihan paling fleksibel dan lincah! Sangat mudah bermanuver menembus gang sempit Kampung Batik Laweyan & Kauman serta mencari warung kuliner legendaris tersembunyi.'
        };
      case 'car':
        return {
          mode: 'Rental Mobil + Driver / Kendaraan Pribadi',
          costNote: 'Estimasi Rp 450.000 - Rp 650.000 / hari (All-in)',
          tip: 'Sangat nyaman dan aman, terutama bila rute Anda mencapai dataran tinggi sejuk Candi Cetho & Kebun Teh Kemuning (Karanganyar) atau Selo (Boyolali) yang membutuhkan tenaga menanjak.'
        };
      default:
        return {
          mode: 'Transportasi Fleksibel (Ojol & Jalan Kaki)',
          costNote: 'Estimasi Rp 50.000 - Rp 100.000 / hari',
          tip: 'Kawasan pusat kota Solo sangat ramah pejalan kaki dengan trotoar lebar di Jalan Slamet Riyadi dan Jalan Gatot Subroto (Gatsu).'
        };
    }
  }

  buildSummaryText(days, interest, budgetTier) {
    const budgetLabels = {
      budget: 'Hemat & Cermat (Backpacker)',
      standard: 'Standar & Nyaman (Smart Traveler)',
      comfort: 'Sultan & Eksklusif (Premium Experience)'
    };

    const interestLabels = {
      all: 'Pilihan Lengkap Ikonik Solo Raya',
      culinary: 'Eksplorasi Kuliner Otentik Legendaris',
      culture: 'Sejarah, Keraton & Akulturasi Budaya',
      shopping: 'Belanja Batik, Suvenir Khas & Antik',
      nature: 'Keindahan Alam & Healing Pegunungan Lawu'
    };

    return `Rencana liburan ${days} Hari berfokus pada ${interestLabels[interest] || 'Solo Raya'} dengan gaya ${budgetLabels[budgetTier] || 'Smart Traveler'}. Seluruh rute dirancang berurutan tanpa bolak-balik.`;
  }
}

// Helper export
window.DolanesiaPlanner = DolanesiaPlanner;
