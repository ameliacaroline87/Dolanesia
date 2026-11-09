# DOLANESIA - Smart Tourism Itinerary Planner & Travel Buddy Solo Raya

<p align="center">
  <img src="assets/img/logo-full.png" alt="DOLANESIA - Teman Jalan Pintar" width="280">
  <br>
  <strong>TEMAN JALAN PINTAR • The Spirit of Java Solo Raya</strong>
</p>

![DOLANESIA Banner](https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80)

**DOLANESIA** adalah platform web aplikasi perencana liburan pintar (*Smart Tourism Itinerary Planner*) dan jejaring sosial pariwisata (*Solo-to-Social Travel Buddy*) yang berfokus di kawasan **Solo Raya** (Surakarta, Karanganyar, Boyolali, Sukoharjo, Klaten, Sragen, Wonogiri).

Didesain dengan pendekatan **Mobile-First Web App / PWA** dan arsitektur **Multi-Page SPA (Single Page Application)**, DOLANESIA membagi setiap menu ke dalam halaman/tampilan tersendiri yang rapi, ringan, dan cepat tanpa harus menggulir (scroll) panjang ke bawah.

---

## 🌟 Fitur Utama & Arsitektur Multi-Page

### 1. Navigasi Multi-Halaman Mandiri (Per-Page Views)
* **Header / Navbar Modern**:
  * Logo resmi DOLANESIA di pojok kiri atas **tanpa latar belakang kotak (frameless / transparent)**.
  * Navigasi tab independen:
    * `Beranda` (`#view-beranda`)
    * `Auto-Planner` (`#view-planner`)
    * `Direktori Kuliner & Wisata` (`#view-direktori`)
    * `Travel Buddy (Open Trip)` (`#view-buddy`)
    * `Tentang Kami` (`#view-tentang`)
    * `Akun & Profil Wisatawan` (`#view-profil`)
    * `Dashboard Administrator` (`#view-admin`)
  * Setiap tab membuka halaman tersendiri dengan animasi transisi halus (`fadeInPage`) dan langsung memposisikan tampilan di atas tanpa scroll panjang.
  * **Deep Linking**: Mendukung riwayat peramban (URL Hash Routing `#beranda`, `#planner`, `#direktori`, `#buddy`, dll.).

### 2. Sistem Autentikasi & Akun Pengguna (Customer & Admin)
* **Modal Autentikasi Interaktif**:
  1. **Login Wisatawan (Customer)**: Masuk menggunakan Nomor WhatsApp atau Email beserta Kata Sandi.
  2. **Daftar Akun Baru (Register)**: Formulir pendaftaran akun lengkap:
     * Nama Lengkap
     * Nomor WhatsApp Aktif (untuk koordinasi grup open trip)
     * Kota Asal (Bandung, Jakarta, Surabaya, dll.)
     * Alamat Email
     * Kata Sandi
  3. **Portal Login Administrator**: Akses khusus admin dengan verifikasi kredensial otoritas (`admin@dolanesia.id` / `admin123`).
  4. **1-Click Quick Demo Login**: Tombol demo cepat untuk menguji pengalaman login wisatawan maupun administrator dalam satu klik.
* **Header Auth State**:
  * Menampilkan tombol *Masuk / Daftar* jika belum login.
  * Menampilkan avatar, nama panggilan, indikator status online, dan menu dropdown (*Profil*, *Keranjang Rencana*, *Keluar/Logout*) jika sudah masuk.
  * Banner status login terintegrasi di drawer menu mobile.

### 3. Halaman Profil & Pengaturan Traveler (`#view-profil`)
* **Header Profil Dinamis**: Menampilkan foto profil, badge status (*Solo Traveler Explorer*), nama lengkap, kota asal, nomor WhatsApp, email, dan tombol cepat keluar.
* **Sub-Tab Profil**:
  * **Informasi Akun**: Formulir interaktif untuk mengubah nama, no. telepon/WA, email, kota asal, dan bio singkat traveler.
  * **Rencana Saya**: Menampilkan daftar destinasi yang disimpan di keranjang beserta badge kuantitas.
  * **Open Trip Saya**: Daftar riwayat keikutsertaan open trip dengan tombol langsung ke grup koordinasi WhatsApp host.
  * **Pengaturan & Notifikasi**: Pengaturan preferensi pengingat WhatsApp, notifikasi teman baru, ubah kata sandi, dan tombol *Keluar dari Semua Sesi*.

### 4. Dashboard Khusus Administrator (`#view-admin`)
* **Halaman Terproteksi**: Hanya dapat diakses oleh akun dengan role `admin`.
* **Statistik Pariwisata**: Menampilkan metrik total kunjungan, wisatawan terdaftar, open trip aktif, dan spot destinasi.
* **Manajemen Open Trip**: Tabel verifikasi status kuota trip (Buka/Tutup Slot Kuota) dan opsi hapus trip.
* **Tambah Destinasi Kuliner / Wisata**: Formulir penambahan destinasi dan kuliner baru langsung ke direktori aplikasi secara real-time.

### 5. Fitur Utama 1: Auto-Itinerary Generator (Perencana Otomatis Cerdas)
* **Parameter Fleksibel**:
  * **Durasi**: 1 Hari (*Solo Express Heritage*), 2 Hari (*Weekend Explorer*), 3 Hari (*Grand Solo Raya Adventure*).
  * **Kategori Minat**: Campuran / All-in-One, Kuliner Otentik Legendaris, Sejarah & Budaya, Belanja & Batik, Alam & Healing.
  * **Budget Tier**: Hemat (Backpacker), Standar (Smart Traveler), Nyaman (Sultan).
  * **Moda Transportasi**: Sewa Motor / Ojol, Batik Solo Trans (BST), Mobil Rental / Pribadi.
* **Hasil Terstruktur Per Jam**:
  * Tab per hari (Hari ke-1, 2, 3).
  * Timeline per jam dengan estimasi biaya, tips rahasia lokal (*Tips Wong Solo*), dan tombol rute langsung ke Google Maps.
  * Ringkasan total estimasi biaya liburan & panduan mobilitas transportasi.
  * Tombol **Bagikan ke WhatsApp** dan **Cetak / Simpan PDF**.

### 6. Fitur Utama 2: Direktori Kuliner & Wisata Otentik Solo Raya
* **13 Foto Lokal Autentik Asli**:
  * *Kuliner*: Tengkleng Klewer Bu Edi, Nasi Liwet Bu Sri, Selat Solo Mbak Lies, Serabi Notosuman Ny. Handayani, Soto Gading 1.
  * *Budaya & Sejarah*: Masjid Raya Sheikh Zayed, Pura Mangkunegaran, Keraton Kasunanan, Pasar Gede Hardjonagoro, Pasar Antik Triwindu, Kampung Batik Laweyan, De Tjolomadoe.
  * *Alam & Rekreasi*: Solo Safari, Candi Cetho & Kebun Teh Karanganyar.
* **Fitur Pencarian & Filter**: Filter tombol pill kategori, filter dropdown per kabupaten/kota di Solo Raya, live search, serta tombol modal detail dan *"Masukkan ke Itinerary"*.

### 7. Fitur Utama 3: Solo-to-Social Tour Package (Travel Buddy Matching)
* **Katalog Open Trip Komunitas**:
  * *Open Trip Kuliner Malam Ngarsopuro & Triwindu*
  * *City Heritage Walking Tour Keraton & Mangkunegaran*
  * *Sunrise Candi Cetho & Kemuning Adventure*
  * *Hunting Batik & Kuliner Pagi Pasar Gede*
* **Sistem Kuota & Avatar**: Menampilkan sisa kuota, avatar peserta yang telah bergabung, dan profil host terverifikasi.
* **Simulasi Gabung WhatsApp Group**: Formulir pendaftaran instan yang langsung menghubungkan pengguna ke WhatsApp koordinasi komunitas.
* **Buat Ajakan Trip Sendiri**: Pengguna dapat mempublikasikan ajakan jalan-jalan baru secara mandiri.

---

## 🎨 Desain & UI/UX

* **Mobile-First Experience**: Dilengkapi **Bottom Navigation Bar** modern (5 tab menu utama) ala aplikasi native (PWA) di layar smartphone.
* **Palet Warna Budaya Modern Solo Raya**:
  * **Solo Terracotta** (`#D95D39`): Warna hangat tanah liat candi dan keramahan Solo.
  * **Batik Sogan Keraton** (`#2C1810`): Warna elegan khas kain batik keraton Kasunanan & Mangkunegaran.
  * **Fresh Green Nature** (`#059669`): Representasi alam sejuk Karanganyar & Boyolali.
* **Micro-interactions & Toast System**: Notifikasi animasi halus untuk setiap aksi login, penambahan rute, atau pembaruan profil.

---

## 📂 Struktur Berkas

```
DOLANESIA/
├── index.html              # Aplikasi Web Multi-Page SPA lengkap
├── manifest.json           # Konfigurasi PWA (Web App Manifest)
├── sw.js                   # Service Worker (Cache dolanesia-v4)
├── assets/
│   └── img/                # Asset logo & 13 foto autentik Solo Raya
├── css/
│   └── custom.css          # Animasi halaman, tab indicator, & timeline stem
├── js/
│   ├── data.js             # Basis data destinasi & open trip Solo Raya
│   ├── planner.js          # Algoritma Smart Itinerary Generator
│   └── app.js              # State manager, SPA router, auth, profile & admin
└── README.md               # Dokumentasi lengkap proyek
```

---

## 🚀 Cara Menjalankan

Aplikasi ini bersifat **zero-dependency**, tidak memerlukan instalasi Node.js atau kompilasi build tools:

1. Buka folder proyek `DOLANESIA`.
2. Klik ganda file `index.html` untuk langsung membukanya di browser apa pun (Google Chrome, Microsoft Edge, Safari, Firefox).
3. Anda dapat langsung menguji akun demo:
   * **Wisatawan**: Klik tombol *"⚡ Masuk Cepat sebagai Wisatawan (Demo)"* (Akun: Rian Setyawan, 0812-3456-7890).
   * **Admin**: Masuk ke tab Admin, klik *"⚡ Masuk Cepat sebagai Admin (Demo)"* atau input `admin@dolanesia.id` / `admin123`.

---

## 📜 Hak Cipta & Informasi

© 2026 **DOLANESIA** - BizVibe Quintet. All Rights Reserved.
