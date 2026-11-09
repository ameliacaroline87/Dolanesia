<?php
/**
 * DOLANESIA - Backend Sync API for Open Trips / Travel Buddy
 * Synchronizes community trips across devices on InfinityFree.
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/data/trips.json';
$dataDir  = __DIR__ . '/data';

if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

function getTripsData($dataFile) {
    if (!file_exists($dataFile)) {
        return [];
    }
    $content = @file_get_contents($dataFile);
    if (!$content) return [];
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function saveTripsData($dataFile, $trips) {
    return file_put_contents($dataFile, json_encode(array_values($trips), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

$trips = getTripsData($dataFile);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'success' => true,
        'count'   => count($trips),
        'trips'   => $trips
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input    = json_decode($rawInput, true);

    if (!$input || !isset($input['action'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Aksi tidak valid.']);
        exit;
    }

    $action = $input['action'];

    // CREATE TRIP
    if ($action === 'create') {
        $newTrip = $input['trip'] ?? null;
        if (!$newTrip || empty($newTrip['title'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data trip tidak lengkap.']);
            exit;
        }
        $newTrip['id'] = $newTrip['id'] ?? ('trip-' . round(microtime(true) * 1000));
        array_unshift($trips, $newTrip);
        saveTripsData($dataFile, $trips);

        echo json_encode(['success' => true, 'message' => 'Trip berhasil dibuat.', 'trip' => $newTrip, 'trips' => $trips]);
        exit;
    }

    // JOIN TRIP
    if ($action === 'join') {
        $tripId   = $input['tripId'] ?? null;
        $joinUser = $input['user'] ?? null;
        if (!$tripId || !$joinUser) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data join trip tidak lengkap.']);
            exit;
        }

        $found = false;
        foreach ($trips as $idx => $t) {
            if ($t['id'] === $tripId) {
                if (!isset($t['joinedUsers']) || !is_array($t['joinedUsers'])) {
                    $trips[$idx]['joinedUsers'] = [];
                }
                $trips[$idx]['joinedUsers'][] = $joinUser;
                $found = true;
                break;
            }
        }

        if ($found) {
            saveTripsData($dataFile, $trips);
            echo json_encode(['success' => true, 'message' => 'Berhasil bergabung trip.', 'trips' => $trips]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Trip tidak ditemukan.']);
        }
        exit;
    }

    // BATCH SYNC TRIPS
    if ($action === 'sync_batch') {
        $incomingTrips = $input['trips'] ?? [];
        if (is_array($incomingTrips) && count($incomingTrips) > 0) {
            foreach ($incomingTrips as $inTrip) {
                if (empty($inTrip['id'])) continue;
                $found = false;
                foreach ($trips as $idx => $t) {
                    if ($t['id'] === $inTrip['id']) {
                        $trips[$idx] = array_merge($t, $inTrip);
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $trips[] = $inTrip;
                }
            }
            saveTripsData($dataFile, $trips);
        }
        echo json_encode(['success' => true, 'count' => count($trips), 'trips' => $trips]);
        exit;
    }

    // DELETE TRIP
    if ($action === 'delete') {
        $tripId = $input['tripId'] ?? null;
        $newTrips = [];
        foreach ($trips as $t) {
            if ($t['id'] !== $tripId) {
                $newTrips[] = $t;
            }
        }
        $trips = $newTrips;
        saveTripsData($dataFile, $trips);
        echo json_encode(['success' => true, 'message' => 'Trip berhasil dihapus.', 'trips' => $trips]);
        exit;
    }
}
