<?php
header('Content-Type: application/json');

// Aktivera felsökning (för utveckling, inaktivera i produktion)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Filen där bokningar lagras
$file = 'bookings.json';

// Funktion för att ta bort äldre bokningar
function removeOldBookings($file) {
    if (file_exists($file)) {
        $currentBookings = json_decode(file_get_contents($file), true);
        if (isset($currentBookings['bookings']) && is_array($currentBookings['bookings'])) {
            // Filtrera bort bokningar där tiden har passerat
            $currentTime = time();
            $currentBookings['bookings'] = array_filter($currentBookings['bookings'], function ($booking) use ($currentTime) {
                $bookingEndTime = strtotime($booking['date'] . ' ' . $booking['time_to']);
                return $bookingEndTime > $currentTime;
            });

            // Omvandla arrayen till en indexerad array igen (för att bibehålla strukturen)
            $currentBookings['bookings'] = array_values($currentBookings['bookings']);

            // Uppdatera filen med de aktuella bokningarna
            file_put_contents($file, json_encode($currentBookings, JSON_PRETTY_PRINT));
        }
    }
}

// Anropa funktionen för att ta bort äldre bokningar
removeOldBookings($file);

// Hämta data från förfrågan
$data = json_decode(file_get_contents('php://input'), true);

// Hantera GET- och POST-förfrågningar
$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod === 'GET') {
    // Hämta bokningar för ett specifikt datum
    $date = isset($_GET['date']) ? $_GET['date'] : null;
    if ($date) {
        if (file_exists($file)) {
            $currentBookings = json_decode(file_get_contents($file), true);
            if (!isset($currentBookings['bookings'])) {
                $currentBookings['bookings'] = [];
            }

            // Filtrera bort bokningar där tiden har passerat
            $currentTime = time();
            $currentBookings['bookings'] = array_filter($currentBookings['bookings'], function ($booking) use ($currentTime) {
                $bookingEndTime = strtotime($booking['date'] . ' ' . $booking['time_to']);
                return $bookingEndTime > $currentTime;
            });

            // Filtrera bokningar för det specifika datumet
            $filteredBookings = array_filter($currentBookings['bookings'], function ($booking) use ($date) {
                return $booking['date'] === $date;
            });

            // Sortera bokningar efter 'time_from'
            usort($filteredBookings, function ($a, $b) {
                return strtotime($a['time_from']) - strtotime($b['time_from']);
            });

            // Returnera bokningarna som en JSON-struktur
            echo json_encode(array_values($filteredBookings));
        } else {
            echo json_encode(['message' => 'Inga bokningar hittades.']);
        }
    } else {
        echo json_encode(['error' => 'Inget datum angivet.']);
    }
} elseif ($requestMethod === 'POST') {
    // Lägg till en ny bokning
if (isset($data['booking_name'], $data['booking_date'], $data['time_from'], $data['time_to'])) {
    if (file_exists($file)) {
        $currentBookings = json_decode(file_get_contents($file), true);
        if (!isset($currentBookings['bookings'])) {
            $currentBookings['bookings'] = [];
        }
    } else {
        $currentBookings = ['bookings' => []];
    }

    // Skapa en ny bokning med ett unikt ID
    $newBooking = [
        'ID' => empty($currentBookings['bookings']) ? 1 : max(array_column($currentBookings['bookings'], 'ID')) + 1,
        'name' => $data['booking_name'],
        'date' => $data['booking_date'],
        'time_from' => $data['time_from'],
        'time_to' => $data['time_to'],
        'timestamp' => date('Y-m-d H:i:s')
    ];

    // Kontrollera om bokningen krockar med en befintlig
    $bookingConflict = false;
    foreach ($currentBookings['bookings'] as $booking) {
        if ($booking['date'] === $newBooking['date']) {
            $existingStart = strtotime($booking['time_from']);
            $existingEnd = strtotime($booking['time_to']);
            $newStart = strtotime($newBooking['time_from']);
            $newEnd = strtotime($newBooking['time_to']);

            if (($newStart < $existingEnd) && ($newEnd > $existingStart)) {
                $bookingConflict = true;
                break;
            }
        }
    }

    if ($bookingConflict) {
        echo json_encode(['message' => 'Finns något bokat redan inom detta tidsintervall.']);
        exit();
    }

    // Lägg till bokningen
    $currentBookings['bookings'][] = $newBooking;

    if (file_put_contents($file, json_encode($currentBookings, JSON_PRETTY_PRINT))) {
        echo json_encode(['message' => 'Bokningen sparades framgångsrikt!', 'booking' => $newBooking]);
    } else {
        echo json_encode(['message' => 'Kunde inte spara bokningen.']);
    }
}

} elseif ($requestMethod === 'DELETE') {
    // Avboka en bokning
    if (isset($data['remove_id'])) {
        $removeId = $data['remove_id'];
    
        if (file_exists($file)) {
            $currentBookings = json_decode(file_get_contents($file), true);
    
            // Kontrollera om filen har rätt struktur och omvandla till array om det är ett objekt
            if (!isset($currentBookings['bookings']) || !is_array($currentBookings['bookings'])) {
                $currentBookings['bookings'] = array_values((array)$currentBookings['bookings']);
            }
    
            // Ta bort bokningen
            $currentBookings['bookings'] = array_filter($currentBookings['bookings'], function($booking) use ($removeId) {
                return $booking['ID'] != $removeId;
            });
    
            // Omvandla till indexerad array för att säkerställa rätt struktur
            $currentBookings['bookings'] = array_values($currentBookings['bookings']);
    
            // Uppdatera filen
            if (file_put_contents($file, json_encode($currentBookings, JSON_PRETTY_PRINT))) {
                echo json_encode([
                    'message' => 'Bokning borttagen framgångsrikt!',
                    'bookings' => $currentBookings['bookings'] // Skicka med uppdaterade bokningar
                ]);
                exit();
            } else {
                echo json_encode(['message' => 'Kunde inte uppdatera bokningsfilen.']);
                exit();
            }
        } else {
            echo json_encode(['message' => 'Bokningsfilen hittades inte.']);
            exit();
        }
    }
}
?>
