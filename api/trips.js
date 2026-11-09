// ==============================================================================
// Vercel Serverless Function: /api/trips
// Mendukung Upstash (Redis / Vercel KV) untuk sinkronisasi open trip
// ==============================================================================

const SEED_TRIPS = [
  {
    id: 'trip-1',
    title: 'Eksplorasi Keraton & Kuliner Malam Solo',
    description: 'Jalan santai mengelilingi Baluwarti, Keraton Surakarta, dan berburu nasi liwet legendaris di Keprabon bareng sesama solo traveler.',
    date: '2026-11-15',
    time: '15:30 WIB',
    meeting_point: 'Kori Kamandungan Keraton Surakarta',
    quotaJoined: 2,
    quotaMax: 6,
    category: 'budaya',
    host: {
      name: 'Budi Santoso',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      phone: '0812-3456-7890'
    },
    joinedUsers: [
      {
        id: 'user-rian',
        name: 'Rian Setyawan',
        city: 'Jakarta',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80'
      }
    ],
    created_at: '2026-11-08T09:00:00Z'
  }
];

function getUpstashCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

async function kvGet(key) {
  const { url, token } = getUpstashCredentials();
  if (!url || !token) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', key])
    });
    if (!res.ok) {
      const res2 = await fetch(`${url}/get/${key}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res2.ok) return null;
      const json2 = await res2.json();
      return json2 && json2.result ? (typeof json2.result === 'string' ? JSON.parse(json2.result) : json2.result) : null;
    }
    const json = await res.json();
    if (!json || json.result === null || json.result === undefined) return null;
    return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
  } catch (e) {
    return null;
  }
}

async function kvSet(key, value) {
  const { url, token } = getUpstashCredentials();
  if (!url || !token) return false;
  const strVal = typeof value === 'string' ? value : JSON.stringify(value);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', key, strVal])
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, token } = getUpstashCredentials();
  const isUpstashConnected = Boolean(url && token);

  let trips = null;
  if (isUpstashConnected) {
    trips = await kvGet('dolanesia_trips');
  }

  if (!trips || !Array.isArray(trips) || trips.length === 0) {
    trips = SEED_TRIPS;
    if (isUpstashConnected) {
      await kvSet('dolanesia_trips', trips);
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      storage: isUpstashConnected ? 'upstash-redis' : 'in-memory-seed',
      trips: trips,
      total: trips.length
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const action = body.action || req.query.action || 'create';

    if (action === 'create' || action === 'create_trip') {
      const newTrip = body.trip || body;
      if (!newTrip || !newTrip.title) {
        return res.status(400).json({ success: false, message: 'Judul trip wajib diisi.' });
      }

      const tripToSave = {
        id: newTrip.id || ('trip-' + Date.now()),
        title: newTrip.title.trim(),
        description: newTrip.description || '',
        date: newTrip.date || new Date().toISOString().split('T')[0],
        time: newTrip.time || '08:00 WIB',
        meeting_point: newTrip.meeting_point || 'Solo Kota',
        quotaJoined: newTrip.quotaJoined || 1,
        quotaMax: newTrip.quotaMax || 5,
        category: newTrip.category || 'budaya',
        host: newTrip.host || { name: 'Host Dolanesia' },
        joinedUsers: newTrip.joinedUsers || [],
        created_at: new Date().toISOString()
      };

      trips.push(tripToSave);
      if (isUpstashConnected) {
        await kvSet('dolanesia_trips', trips);
      }

      return res.status(200).json({ success: true, trip: tripToSave, trips: trips, total: trips.length });
    }

    if (action === 'delete_trip' || action === 'delete') {
      const delId = body.tripId || body.id || req.query.id;
      if (delId) {
        trips = trips.filter(t => t.id !== delId);
        if (isUpstashConnected) {
          await kvSet('dolanesia_trips', trips);
        }
      }
      return res.status(200).json({ success: true, trips: trips, total: trips.length });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
