<?php
/**
 * DOLANESIA - Backend Sync API for Registered Users
 * Handles multi-device registration, authentication sync, and admin panel management.
 * Designed for InfinityFree Apache/PHP & production web servers.
 */

// Enable CORS & JSON response
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/data/users.json';
$dataDir  = __DIR__ . '/data';

// Ensure data directory exists
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

// Default initial users seed if file is missing
$defaultSeed = [
    [
        "id" => "admin-budi",
        "name" => "Budi Santoso",
        "phone" => "0811-9876-5432",
        "email" => "admin@dolanesia.id",
        "city" => "Surakarta (Solo)",
        "bio" => "Staff Kurasi Pariwisata & Komunitas Dolanesia Solo Raya.",
        "role" => "admin",
        "roleLabel" => "Super Administrator",
        "joinedAt" => "Januari 2026",
        "avatar" => "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
        "preference" => "Manajemen Destinasi"
    ],
    [
        "id" => "user-rian",
        "name" => "Rian Setyawan",
        "phone" => "0812-3456-7890",
        "email" => "rian.traveler@gmail.com",
        "city" => "Jakarta Selatan",
        "bio" => "Pecinta kuliner legendaris dan penikmat suasana tenang kota Solo. Senang berteman dengan sesama solo traveler!",
        "role" => "customer",
        "roleLabel" => "Solo Traveler Explorer",
        "joinedAt" => "Maret 2026",
        "avatar" => "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        "preference" => "Kuliner Otentik & Cagar Budaya"
    ],
    [
        "id" => "user-nadia",
        "name" => "Nadia Safira",
        "phone" => "0857-1122-3344",
        "email" => "nadia.safira@gmail.com",
        "city" => "Yogyakarta",
        "bio" => "Travel photographer dan penikmat jajanan pasar.",
        "role" => "customer",
        "roleLabel" => "Solo Traveler",
        "joinedAt" => "Februari 2026",
        "avatar" => "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        "preference" => "Sejarah & Belanja"
    ],
    [
        "id" => "user-amelia",
        "name" => "Amelia Charoline",
        "phone" => "0812-9876-1111",
        "email" => "ameliacs5758@gmail.com",
        "city" => "Bandung",
        "bio" => "Solo traveler asal Bandung. Siap menjelajahi ragam budaya dan kuliner Solo Raya!",
        "role" => "customer",
        "roleLabel" => "Solo Traveler Explorer",
        "joinedAt" => "November 2026",
        "avatar" => "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        "preference" => "Kuliner & Wisata Budaya"
    ]
];

function getUsersData($dataFile, $defaultSeed) {
    if (!file_exists($dataFile)) {
        file_put_contents($dataFile, json_encode($defaultSeed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $defaultSeed;
    }
    $content = @file_get_contents($dataFile);
    if (!$content) {
        return $defaultSeed;
    }
    $data = json_decode($content, true);
    return is_array($data) ? $data : $defaultSeed;
}

function saveUsersData($dataFile, $users) {
    return file_put_contents($dataFile, json_encode(array_values($users), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

$users = getUsersData($dataFile, $defaultSeed);

// Handle GET request -> list all registered users
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'success' => true,
        'count'   => count($users),
        'users'   => $users
    ]);
    exit;
}

// Handle POST request -> actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input    = json_decode($rawInput, true);

    if (!$input || !isset($input['action'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Aksi permintaan tidak valid atau format JSON salah.']);
        exit;
    }

    $action = $input['action'];

    // 1. REGISTER / ADD USER
    if ($action === 'register' || $action === 'add') {
        $newUser = $input['user'] ?? null;
        if (!$newUser || empty($newUser['name']) || empty($newUser['email'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nama lengkap dan email aktif wajib diisi.']);
            exit;
        }

        // Clean & normalize
        $newUser['id'] = $newUser['id'] ?? ('user-' . round(microtime(true) * 1000));
        $newUser['name'] = trim($newUser['name']);
        $newUser['email'] = strtolower(trim($newUser['email']));
        $newUser['phone'] = trim($newUser['phone'] ?? '');
        $newUser['city'] = trim($newUser['city'] ?? 'Solo Raya');
        $newUser['role'] = $newUser['role'] ?? 'customer';
        $newUser['roleLabel'] = $newUser['roleLabel'] ?? 'Solo Traveler Explorer';
        $newUser['joinedAt'] = $newUser['joinedAt'] ?? date('F Y');
        $newUser['avatar'] = $newUser['avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
        $newUser['bio'] = $newUser['bio'] ?? ("Solo traveler asal " . $newUser['city'] . ". Siap menjelajahi ragam budaya dan kuliner Solo Raya!");

        // Check if existing user by email or ID
        $foundIndex = -1;
        foreach ($users as $idx => $u) {
            if ((isset($u['email']) && strtolower($u['email']) === $newUser['email']) ||
                (isset($u['id']) && $u['id'] === $newUser['id'])) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            // Update existing user record
            $users[$foundIndex] = array_merge($users[$foundIndex], $newUser);
        } else {
            // Append as new user
            $users[] = $newUser;
        }

        saveUsersData($dataFile, $users);

        echo json_encode([
            'success' => true,
            'message' => 'Pengguna berhasil didaftarkan dan disinkronkan ke server pusat.',
            'user'    => $newUser,
            'count'   => count($users),
            'users'   => $users
        ]);
        exit;
    }

    // 2. BATCH SYNC (Useful when a tester reopens app with stored local users)
    if ($action === 'sync_batch') {
        $incomingUsers = $input['users'] ?? [];
        if (is_array($incomingUsers)) {
            foreach ($incomingUsers as $inUser) {
                if (empty($inUser['name']) || empty($inUser['email'])) continue;
                $email = strtolower(trim($inUser['email']));
                $id = $inUser['id'] ?? null;

                $found = false;
                foreach ($users as $idx => $u) {
                    if ((isset($u['email']) && strtolower($u['email']) === $email) ||
                        ($id && isset($u['id']) && $u['id'] === $id)) {
                        $users[$idx] = array_merge($users[$idx], $inUser);
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $users[] = $inUser;
                }
            }
            saveUsersData($dataFile, $users);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Batch sync berhasil diselesaikan.',
            'count'   => count($users),
            'users'   => $users
        ]);
        exit;
    }

    // 3. UPDATE USER PROFILE
    if ($action === 'update') {
        $updatedUser = $input['user'] ?? null;
        if (!$updatedUser || empty($updatedUser['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data pengguna atau ID tidak valid.']);
            exit;
        }

        $found = false;
        foreach ($users as $idx => $u) {
            if (isset($u['id']) && $u['id'] === $updatedUser['id']) {
                $users[$idx] = array_merge($users[$idx], $updatedUser);
                $found = true;
                break;
            }
        }

        if ($found) {
            saveUsersData($dataFile, $users);
            echo json_encode(['success' => true, 'message' => 'Profil berhasil diperbarui di server.', 'users' => $users]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Pengguna tidak ditemukan.']);
        }
        exit;
    }

    // 4. DELETE USER (Admin Action)
    if ($action === 'delete') {
        $userId = $input['userId'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID pengguna tidak valid.']);
            exit;
        }

        $newUsers = [];
        $found = false;
        foreach ($users as $u) {
            if (isset($u['id']) && $u['id'] === $userId) {
                $found = true;
                continue; // Skip/delete
            }
            $newUsers[] = $u;
        }

        if ($found) {
            $users = $newUsers;
            saveUsersData($dataFile, $users);
            echo json_encode(['success' => true, 'message' => 'Pengguna berhasil dihapus.', 'count' => count($users), 'users' => $users]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Pengguna tidak ditemukan.']);
        }
        exit;
    }

    // 5. TOGGLE ROLE (Admin Action)
    if ($action === 'toggle_role') {
        $userId = $input['userId'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID pengguna tidak valid.']);
            exit;
        }

        $found = false;
        foreach ($users as $idx => $u) {
            if (isset($u['id']) && $u['id'] === $userId) {
                if ($u['role'] === 'admin') {
                    $users[$idx]['role'] = 'customer';
                    $users[$idx]['roleLabel'] = 'Solo Traveler Explorer';
                } else {
                    $users[$idx]['role'] = 'admin';
                    $users[$idx]['roleLabel'] = 'Administrator Dolanesia';
                }
                $found = true;
                break;
            }
        }

        if ($found) {
            saveUsersData($dataFile, $users);
            echo json_encode(['success' => true, 'message' => 'Peran pengguna berhasil diubah.', 'users' => $users]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Pengguna tidak ditemukan.']);
        }
        exit;
    }

    // Unknown action
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => "Aksi '$action' tidak dikenal."]);
    exit;
}
