<?php
// ==============================================================================
// Dolanesia Native Backend API (Sistem Database Terpusat cPanel / InfinityFree)
// Mengadopsi arsitektur teruji CONFindo: api.php di root & data/users_live.json
// ==============================================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-cache, no-store, must-revalidate');

$requestMethod = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/data';
$usersFile = $dataDir . '/users_live.json';
$tripsFile = $dataDir . '/trips_live.json';

// Pastikan folder data ada
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

// Lindungi folder data agar tidak bisa diunduh langsung lewat browser
$htaccessFile = $dataDir . '/.htaccess';
if (!file_exists($htaccessFile)) {
    @file_put_contents($htaccessFile, "Order Allow,Deny\nDeny from all\n<Files ~ \"^.*$\">\n    Deny from all\n</Files>\n");
}

// -----------------------------------------------------------------------------
// Seed Data Awal Pengguna (jika file belum ada)
// -----------------------------------------------------------------------------
if (!file_exists($usersFile)) {
    $initialUsers = [
        [
            'id' => 'admin-01',
            'name' => 'Amelia Charoline (Admin)',
            'phone' => '0857-2595-7927',
            'email' => 'admin@dolanesia.com',
            'city' => 'Surakarta',
            'bio' => 'Founder & Local Host Dolanesia Solo Raya. Siap memandu perjalanan budaya dan kuliner terbaikmu.',
            'role' => 'admin',
            'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            'joined_at' => '2026-01-10T08:00:00Z',
            'created_at' => '2026-01-10T08:00:00Z'
        ],
        [
            'id' => 'user-budi',
            'name' => 'Budi Santoso',
            'phone' => '0812-3456-7890',
            'email' => 'budi.santoso@gmail.com',
            'city' => 'Surabaya',
            'bio' => 'Solo traveler pecinta kuliner pedas legendaris dan penikmat suasana tenang kota Solo.',
            'role' => 'customer',
            'avatar' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            'joined_at' => '2026-02-01T10:30:00Z',
            'created_at' => '2026-02-01T10:30:00Z'
        ],
        [
            'id' => 'user-rian',
            'name' => 'Rian Setyawan',
            'phone' => '0813-9876-5432',
            'email' => 'rian.setyawan@gmail.com',
            'city' => 'Jakarta',
            'bio' => 'Fotografer jalanan yang suka mengabadikan arsitektur kolonial dan pasar tradisional Solo.',
            'role' => 'customer',
            'avatar' => 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
            'joined_at' => '2026-02-15T12:00:00Z',
            'created_at' => '2026-02-15T12:00:00Z'
        ],
        [
            'id' => 'user-nadia',
            'name' => 'Nadia Safira',
            'phone' => '0857-1122-3344',
            'email' => 'nadia.safira@gmail.com',
            'city' => 'Bandung',
            'bio' => 'Suka berburu batik klasik di Pasar Klewer dan ngopi sore di Pracima Tuin.',
            'role' => 'customer',
            'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
            'joined_at' => '2026-02-20T09:15:00Z',
            'created_at' => '2026-02-20T09:15:00Z'
        ]
    ];
    @file_put_contents($usersFile, json_encode($initialUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// -----------------------------------------------------------------------------
// Seed Data Awal Open Trips (jika file belum ada)
// -----------------------------------------------------------------------------
if (!file_exists($tripsFile)) {
    $initialTrips = [
        [
            'id' => 'trip-1',
            'title' => 'Eksplorasi Keraton & Kuliner Malam Solo',
            'description' => 'Jalan santai mengelilingi Baluwarti, Keraton Surakarta, dan berburu nasi liwet legendaris di Keprabon bareng sesama solo traveler.',
            'date' => '2026-11-15',
            'time' => '15:30 WIB',
            'meeting_point' => 'Kori Kamandungan Keraton Surakarta',
            'max_participants' => 6,
            'category' => 'budaya',
            'host' => [
                'name' => 'Budi Santoso',
                'avatar' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
                'phone' => '0812-3456-7890'
            ],
            'joinedUsers' => [
                [
                    'id' => 'user-rian',
                    'name' => 'Rian Setyawan',
                    'joined_at' => '2026-11-08T10:00:00Z'
                ]
            ],
            'created_at' => '2026-11-08T09:00:00Z'
        ]
    ];
    @file_put_contents($tripsFile, json_encode($initialTrips, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Helper membaca data
function readData($file) {
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Helper menyimpan data secara aman
function writeData($file, $data) {
    return @file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Dapatkan aksi dari GET atau POST
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

// Baca body JSON jika ada
$rawInput = @file_get_contents('php://input');
$bodyData = json_decode($rawInput, true);
if (is_array($bodyData) && empty($action) && isset($bodyData['action'])) {
    $action = $bodyData['action'];
}

// =============================================================================
// ROUTE 1: TEST KONEKSI SERVER
// =============================================================================
if ($action === 'test') {
    echo json_encode([
        'success' => true,
        'message' => 'API PHP Dolanesia Aktif & Berjalan di Server Hosting 🚀',
        'php_version' => phpversion(),
        'users_file_exists' => file_exists($usersFile),
        'trips_file_exists' => file_exists($tripsFile)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// =============================================================================
// ROUTE 2: GET SEMUA DATA TERPADU (USERS + TRIPS)
// =============================================================================
if ($action === 'get_all_data') {
    $users = readData($usersFile);
    $trips = readData($tripsFile);
    echo json_encode([
        'success' => true,
        'users' => $users,
        'trips' => $trips,
        'count_users' => count($users),
        'count_trips' => count($trips)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// =============================================================================
// ROUTE 3: GET SEMUA USERS
// =============================================================================
if ($action === 'get_users' || ($requestMethod === 'GET' && empty($action))) {
    $users = readData($usersFile);
    echo json_encode([
        'success' => true,
        'users' => $users,
        'total' => count($users)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// =============================================================================
// ROUTE 4: DAFTAR / SIMPAN USER BARU (create_user / register)
// =============================================================================
if ($action === 'create_user' || $action === 'register') {
    $userCandidate = is_array($bodyData) ? $bodyData : [];

    // Fallback: baca dari $_POST / $_GET jika JSON body kosong (misal lewat form data / query string)
    if (empty($userCandidate['name'])) {
        $userCandidate['name'] = isset($_POST['name']) ? $_POST['name'] : (isset($_GET['name']) ? $_GET['name'] : '');
    }
    if (empty($userCandidate['phone'])) {
        $userCandidate['phone'] = isset($_POST['phone']) ? $_POST['phone'] : (isset($_GET['phone']) ? $_GET['phone'] : '');
    }
    if (empty($userCandidate['email'])) {
        $userCandidate['email'] = isset($_POST['email']) ? $_POST['email'] : (isset($_GET['email']) ? $_GET['email'] : '');
    }
    if (empty($userCandidate['city'])) {
        $userCandidate['city'] = isset($_POST['city']) ? $_POST['city'] : (isset($_GET['city']) ? $_GET['city'] : 'Surakarta');
    }
    if (empty($userCandidate['bio'])) {
        $userCandidate['bio'] = isset($_POST['bio']) ? $_POST['bio'] : (isset($_GET['bio']) ? $_GET['bio'] : '');
    }
    if (empty($userCandidate['role'])) {
        $userCandidate['role'] = isset($_POST['role']) ? $_POST['role'] : (isset($_GET['role']) ? $_GET['role'] : 'customer');
    }
    if (empty($userCandidate['id'])) {
        $userCandidate['id'] = isset($_POST['id']) ? $_POST['id'] : (isset($_GET['id']) ? $_GET['id'] : ('user-' . time()));
    }

    if (empty($userCandidate['name']) || (empty($userCandidate['phone']) && empty($userCandidate['email']))) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Nama lengkap dan nomor kontak (WhatsApp/Telepon atau Email) wajib diisi.'
        ]);
        exit;
    }

    $cleanPhone = preg_replace('/[^0-9]/', '', $userCandidate['phone']);
    $cleanEmail = strtolower(trim($userCandidate['email']));
    $users = readData($usersFile);

    $existsIndex = -1;
    foreach ($users as $idx => $u) {
        $uPhone = isset($u['phone']) ? preg_replace('/[^0-9]/', '', $u['phone']) : '';
        $uEmail = isset($u['email']) ? strtolower(trim($u['email'])) : '';
        if ((!empty($cleanPhone) && $uPhone === $cleanPhone) || (!empty($cleanEmail) && $uEmail === $cleanEmail)) {
            $existsIndex = $idx;
            break;
        }
    }

    $name = trim($userCandidate['name']);
    $avatar = !empty($userCandidate['avatar']) ? $userCandidate['avatar'] : ('https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=C2410C&color=fff&size=200');

    if ($existsIndex >= 0) {
        // Update user yang sudah ada
        $users[$existsIndex]['name'] = $name;
        $users[$existsIndex]['phone'] = trim($userCandidate['phone']);
        $users[$existsIndex]['email'] = $cleanEmail;
        $users[$existsIndex]['city'] = trim($userCandidate['city']);
        if (!empty($userCandidate['bio'])) $users[$existsIndex]['bio'] = trim($userCandidate['bio']);
        if (!empty($userCandidate['avatar'])) $users[$existsIndex]['avatar'] = $avatar;
        $savedUser = $users[$existsIndex];
    } else {
        // Tambah user baru
        $newUser = [
            'id' => !empty($userCandidate['id']) ? $userCandidate['id'] : ('user-' . time() . '-' . rand(100, 999)),
            'name' => $name,
            'phone' => trim($userCandidate['phone']),
            'email' => $cleanEmail,
            'city' => !empty($userCandidate['city']) ? trim($userCandidate['city']) : 'Surakarta',
            'bio' => !empty($userCandidate['bio']) ? trim($userCandidate['bio']) : 'Solo traveler penikmat pesona Solo Raya.',
            'role' => ($userCandidate['role'] === 'admin') ? 'admin' : 'customer',
            'avatar' => $avatar,
            'joined_at' => date('c'),
            'created_at' => date('c')
        ];
        $users[] = $newUser;
        $savedUser = $newUser;
    }

    writeData($usersFile, $users);
    echo json_encode([
        'success' => true,
        'message' => 'Data wisatawan berhasil disimpan ke server database!',
        'user' => $savedUser,
        'users' => $users,
        'total' => count($users)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// =============================================================================
// ROUTE 5: SINKRONISASI BATCH DARI CLIENT (sync_users / sync_batch)
// =============================================================================
if ($action === 'sync_users' || $action === 'sync_batch') {
    $clientUsers = isset($bodyData['users']) && is_array($bodyData['users']) ? $bodyData['users'] : [];
    $serverUsers = readData($usersFile);

    $merged = $serverUsers;
    $updated = false;

    foreach ($clientUsers as $cu) {
        if (!is_array($cu) || empty($cu['name'])) continue;
        $cPhone = isset($cu['phone']) ? preg_replace('/[^0-9]/', '', $cu['phone']) : '';
        $cEmail = isset($cu['email']) ? strtolower(trim($cu['email'])) : '';

        $found = false;
        foreach ($merged as $su) {
            $sPhone = isset($su['phone']) ? preg_replace('/[^0-9]/', '', $su['phone']) : '';
            $sEmail = isset($su['email']) ? strtolower(trim($su['email'])) : '';
            if ((!empty($cPhone) && $sPhone === $cPhone) || (!empty($cEmail) && $sEmail === $cEmail) || (isset($su['id'], $cu['id']) && $su['id'] === $cu['id'])) {
                $found = true;
                break;
            }
        }

        if (!$found) {
            $merged[] = [
                'id' => isset($cu['id']) ? $cu['id'] : ('user-' . time() . '-' . rand(100, 999)),
                'name' => trim($cu['name']),
                'phone' => isset($cu['phone']) ? trim($cu['phone']) : '',
                'email' => isset($cu['email']) ? strtolower(trim($cu['email'])) : '',
                'city' => isset($cu['city']) ? trim($cu['city']) : 'Surakarta',
                'bio' => isset($cu['bio']) ? trim($cu['bio']) : 'Solo traveler penikmat pesona Solo Raya.',
                'role' => (isset($cu['role']) && $cu['role'] === 'admin') ? 'admin' : 'customer',
                'avatar' => isset($cu['avatar']) ? $cu['avatar'] : ('https://ui-avatars.com/api/?name=' . urlencode($cu['name']) . '&background=C2410C&color=fff'),
                'joined_at' => isset($cu['joined_at']) ? $cu['joined_at'] : date('c'),
                'created_at' => isset($cu['created_at']) ? $cu['created_at'] : date('c')
            ];
            $updated = true;
        }
    }

    if ($updated) {
        writeData($usersFile, $merged);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Sinkronisasi berhasil!',
        'users' => $merged,
        'total' => count($merged)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// =============================================================================
// ROUTE 6: HAPUS USER (delete_user)
// =============================================================================
if ($action === 'delete_user') {
    $delId = isset($_POST['id']) ? $_POST['id'] : (isset($_GET['id']) ? $_GET['id'] : (isset($bodyData['id']) ? $bodyData['id'] : ''));

    if (empty($delId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID pengguna tidak ditemukan.']);
        exit;
    }

    $users = readData($usersFile);
    $initialCount = count($users);
    $users = array_values(array_filter($users, function($u) use ($delId) {
        // Jangan pernah hapus admin default
        if (isset($u['id']) && $u['id'] === 'admin-01') return true;
        if (isset($u['email']) && strtolower(trim($u['email'])) === 'admin@dolanesia.com') return true;
        return isset($u['id']) && $u['id'] !== $delId;
    }));

    writeData($usersFile, $users);
    echo json_encode([
        'success' => true,
        'deleted_id' => $delId,
        'users' => $users,
        'total' => count($users)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// =============================================================================
// ROUTE 7: TOGGLE ROLE USER (toggle_role)
// =============================================================================
if ($action === 'toggle_role') {
    $userId = isset($_POST['id']) ? $_POST['id'] : (isset($_GET['id']) ? $_GET['id'] : (isset($bodyData['id']) ? $bodyData['id'] : ''));
    if (!empty($userId)) {
        $users = readData($usersFile);
        foreach ($users as &$u) {
            if (isset($u['id']) && $u['id'] === $userId) {
                $u['role'] = (isset($u['role']) && $u['role'] === 'admin') ? 'customer' : 'admin';
                break;
            }
        }
        unset($u);
        writeData($usersFile, $users);
        echo json_encode(['success' => true, 'users' => $users, 'total' => count($users)]);
        exit;
    }
}

// =============================================================================
// ROUTE 8: GET SEMUA TRIPS
// =============================================================================
if ($action === 'get_trips') {
    $trips = readData($tripsFile);
    echo json_encode([
        'success' => true,
        'trips' => $trips,
        'total' => count($trips)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// =============================================================================
// ROUTE 9: BUAT OPEN TRIP BARU (create_trip)
// =============================================================================
if ($action === 'create_trip') {
    $trip = is_array($bodyData) ? $bodyData : [];
    if (empty($trip['title'])) {
        $trip['title'] = isset($_POST['title']) ? $_POST['title'] : '';
    }

    if (empty($trip['title'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Judul trip wajib diisi.']);
        exit;
    }

    $trips = readData($tripsFile);
    $newTrip = [
        'id' => !empty($trip['id']) ? $trip['id'] : ('trip-' . time()),
        'title' => trim($trip['title']),
        'description' => !empty($trip['description']) ? trim($trip['description']) : '',
        'date' => !empty($trip['date']) ? $trip['date'] : date('Y-m-d'),
        'time' => !empty($trip['time']) ? $trip['time'] : '08:00 WIB',
        'meeting_point' => !empty($trip['meeting_point']) ? trim($trip['meeting_point']) : 'Solo Kota',
        'max_participants' => !empty($trip['max_participants']) ? intval($trip['max_participants']) : 5,
        'category' => !empty($trip['category']) ? $trip['category'] : 'budaya',
        'host' => !empty($trip['host']) ? $trip['host'] : ['name' => 'Host Dolanesia'],
        'joinedUsers' => !empty($trip['joinedUsers']) ? $trip['joinedUsers'] : [],
        'created_at' => date('c')
    ];

    $trips[] = $newTrip;
    writeData($tripsFile, $trips);
    echo json_encode([
        'success' => true,
        'trip' => $newTrip,
        'trips' => $trips,
        'total' => count($trips)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// =============================================================================
// ROUTE 10: JOIN OPEN TRIP (join_trip)
// =============================================================================
if ($action === 'join_trip') {
    $tripId = isset($_POST['trip_id']) ? $_POST['trip_id'] : (isset($_GET['trip_id']) ? $_GET['trip_id'] : (isset($bodyData['trip_id']) ? $bodyData['trip_id'] : ''));
    $user = isset($bodyData['user']) ? $bodyData['user'] : null;

    if (!empty($tripId) && $user) {
        $trips = readData($tripsFile);
        foreach ($trips as &$t) {
            if (isset($t['id']) && $t['id'] === $tripId) {
                if (!isset($t['joinedUsers']) || !is_array($t['joinedUsers'])) {
                    $t['joinedUsers'] = [];
                }
                $already = false;
                foreach ($t['joinedUsers'] as $ju) {
                    if (isset($ju['id'], $user['id']) && $ju['id'] === $user['id']) {
                        $already = true;
                        break;
                    }
                }
                if (!$already) {
                    $t['joinedUsers'][] = [
                        'id' => isset($user['id']) ? $user['id'] : ('usr-' . time()),
                        'name' => isset($user['name']) ? $user['name'] : 'Traveler',
                        'joined_at' => date('c')
                    ];
                }
                break;
            }
        }
        unset($t);
        writeData($tripsFile, $trips);
        echo json_encode(['success' => true, 'trips' => $trips]);
        exit;
    }
}

// =============================================================================
// ROUTE 11: HAPUS OPEN TRIP (delete_trip)
// =============================================================================
if ($action === 'delete_trip') {
    $delId = isset($_POST['id']) ? $_POST['id'] : (isset($_GET['id']) ? $_GET['id'] : (isset($bodyData['id']) ? $bodyData['id'] : ''));
    if (!empty($delId)) {
        $trips = readData($tripsFile);
        $trips = array_values(array_filter($trips, function($t) use ($delId) {
            return isset($t['id']) && $t['id'] !== $delId;
        }));
        writeData($tripsFile, $trips);
        echo json_encode(['success' => true, 'deleted_id' => $delId, 'trips' => $trips]);
        exit;
    }
}

// Default Fallback
echo json_encode([
    'success' => true,
    'message' => 'API PHP Dolanesia Aktif. Gunakan parameter ?action=...',
    'available_actions' => [
        'test', 'get_all_data', 'get_users', 'create_user', 'sync_users', 'delete_user', 'toggle_role',
        'get_trips', 'create_trip', 'join_trip', 'delete_trip'
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
