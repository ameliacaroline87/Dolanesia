// ==============================================================================
// Vercel Serverless Function: /api/users
// Mendukung Upstash (Redis / Vercel KV) & Supabase untuk sinkronisasi HP-Laptop
// ==============================================================================

const SEED_USERS = [
  {
    id: 'admin-01',
    name: 'Amelia Charoline (Admin)',
    phone: '0857-2595-7927',
    email: 'admin@dolanesia.com',
    city: 'Surakarta',
    bio: 'Founder & Local Host Dolanesia Solo Raya. Siap memandu perjalanan budaya dan kuliner terbaikmu.',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    joined_at: '2026-01-10T08:00:00Z',
    created_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-budi',
    name: 'Budi Santoso',
    phone: '0812-3456-7890',
    email: 'budi.santoso@gmail.com',
    city: 'Surabaya',
    bio: 'Solo traveler pecinta kuliner pedas legendaris dan penikmat suasana tenang kota Solo.',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    joined_at: '2026-02-01T10:30:00Z',
    created_at: '2026-02-01T10:30:00Z'
  },
  {
    id: 'user-rian',
    name: 'Rian Setyawan',
    phone: '0813-9876-5432',
    email: 'rian.setyawan@gmail.com',
    city: 'Jakarta',
    bio: 'Fotografer jalanan yang suka mengabadikan arsitektur kolonial dan pasar tradisional Solo.',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    joined_at: '2026-02-15T12:00:00Z',
    created_at: '2026-02-15T12:00:00Z'
  },
  {
    id: 'user-nadia',
    name: 'Nadia Safira',
    phone: '0857-1122-3344',
    email: 'nadia.safira@gmail.com',
    city: 'Bandung',
    bio: 'Suka berburu batik klasik di Pasar Klewer dan ngopi sore di Pracima Tuin.',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    joined_at: '2026-02-20T09:15:00Z',
    created_at: '2026-02-20T09:15:00Z'
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
    // Upstash command standard POST
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', key])
    });
    if (!res.ok) {
      // Fallback path GET
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
    console.error('Upstash get error:', e);
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
    console.error('Upstash set error:', e);
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

  // Ambil users
  let users = null;
  if (isUpstashConnected) {
    users = await kvGet('dolanesia_users');
  }

  if (!users || !Array.isArray(users) || users.length === 0) {
    users = SEED_USERS;
    if (isUpstashConnected) {
      await kvSet('dolanesia_users', users);
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      storage: isUpstashConnected ? 'upstash-redis' : 'in-memory-seed',
      isUpstashConnected: isUpstashConnected,
      users: users,
      total: users.length
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const action = body.action || req.query.action || 'register';

    if (action === 'register' || action === 'create_user') {
      const newUser = body.user || body;
      if (!newUser || !newUser.name) {
        return res.status(400).json({ success: false, message: 'Nama pengguna wajib diisi.' });
      }

      const cleanPhone = (newUser.phone || '').replace(/[^0-9]/g, '');
      const cleanEmail = (newUser.email || '').toLowerCase().trim();

      const existingIndex = users.findIndex(u => {
        const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
        const uEmail = (u.email || '').toLowerCase().trim();
        return (cleanPhone && uPhone === cleanPhone) || (cleanEmail && uEmail === cleanEmail) || (newUser.id && u.id === newUser.id);
      });

      const userToSave = {
        id: newUser.id || ('user-' + Date.now()),
        name: newUser.name.trim(),
        phone: newUser.phone || '',
        email: cleanEmail,
        city: newUser.city || 'Surakarta',
        bio: newUser.bio || 'Solo traveler penikmat pesona Solo Raya.',
        role: newUser.role === 'admin' ? 'admin' : 'customer',
        avatar: newUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=C2410C&color=fff&size=200`,
        joined_at: newUser.joined_at || new Date().toISOString(),
        created_at: newUser.created_at || new Date().toISOString()
      };

      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...userToSave };
      } else {
        users.push(userToSave);
      }

      if (isUpstashConnected) {
        await kvSet('dolanesia_users', users);
      }

      return res.status(200).json({
        success: true,
        storage: isUpstashConnected ? 'upstash-redis' : 'in-memory-seed',
        user: userToSave,
        users: users,
        total: users.length
      });
    }

    if (action === 'sync_batch' || action === 'sync_users') {
      const incomingList = Array.isArray(body.users) ? body.users : [];
      let updated = false;

      for (const cu of incomingList) {
        if (!cu || !cu.name) continue;
        const cPhone = (cu.phone || '').replace(/[^0-9]/g, '');
        const cEmail = (cu.email || '').toLowerCase().trim();

        const exists = users.some(su => {
          const sPhone = (su.phone || '').replace(/[^0-9]/g, '');
          const sEmail = (su.email || '').toLowerCase().trim();
          return (cPhone && sPhone === cPhone) || (cEmail && sEmail === cEmail) || (cu.id && su.id === cu.id);
        });

        if (!exists) {
          users.push({
            id: cu.id || ('user-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
            name: cu.name.trim(),
            phone: cu.phone || '',
            email: cEmail,
            city: cu.city || 'Surakarta',
            bio: cu.bio || 'Solo traveler penikmat pesona Solo Raya.',
            role: cu.role === 'admin' ? 'admin' : 'customer',
            avatar: cu.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cu.name)}&background=C2410C&color=fff`,
            joined_at: cu.joined_at || new Date().toISOString(),
            created_at: cu.created_at || new Date().toISOString()
          });
          updated = true;
        }
      }

      if (updated && isUpstashConnected) {
        await kvSet('dolanesia_users', users);
      }

      return res.status(200).json({
        success: true,
        storage: isUpstashConnected ? 'upstash-redis' : 'in-memory-seed',
        users: users,
        total: users.length
      });
    }

    if (action === 'delete_user' || action === 'delete') {
      const delId = body.userId || body.id || req.query.id;
      if (delId) {
        users = users.filter(u => u.id !== delId || u.id === 'admin-01');
        if (isUpstashConnected) {
          await kvSet('dolanesia_users', users);
        }
      }
      return res.status(200).json({ success: true, users: users, total: users.length });
    }

    if (action === 'toggle_role') {
      const toggleId = body.userId || body.id || req.query.id;
      const target = users.find(u => u.id === toggleId);
      if (target) {
        target.role = target.role === 'admin' ? 'customer' : 'admin';
        if (isUpstashConnected) {
          await kvSet('dolanesia_users', users);
        }
      }
      return res.status(200).json({ success: true, users: users, total: users.length });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
