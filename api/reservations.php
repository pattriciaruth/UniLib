<?php
// api/reservations.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// Include DB config
require_once __DIR__ . "/../config/config.php";
$conn = getDbConnection();

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? null;

if ($action === "reserve") {
    // ===============================
    // MAKE A RESERVATION
    // ===============================
    if (!isset($data['user_id'], $data['book_id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
        exit;
    }

    $user_id = intval($data['user_id']);
    $book_id = intval($data['book_id']);

    // Insert reservation
    $sql = "INSERT INTO reservations (user_id, book_id) VALUES ($user_id, $book_id)";
    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "Book reserved successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error reserving book: " . $conn->error]);
    }

} elseif ($action === "list") {
    // ===============================
    // LIST RESERVATIONS
    // ===============================
    $result = $conn->query("SELECT reservations.*, users.name AS user_name, books.title AS book_title
                            FROM reservations
                            JOIN users ON reservations.user_id = users.id
                            JOIN books ON reservations.book_id = books.id
                            ORDER BY reservation_date DESC");

    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $reservations]);

} elseif ($action === "cancel") {
    // ===============================
    // CANCEL A RESERVATION
    // ===============================
    if (!isset($data['reservation_id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing reservation_id"]);
        exit;
    }

    $reservation_id = intval($data['reservation_id']);
    $sql = "UPDATE reservations SET status='cancelled' WHERE id=$reservation_id";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "Reservation cancelled"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error cancelling reservation: " . $conn->error]);
    }

} elseif ($action === "fulfill") {
    // ===============================
    // MARK RESERVATION AS FULFILLED
    // ===============================
    if (!isset($data['reservation_id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing reservation_id"]);
        exit;
    }

    $reservation_id = intval($data['reservation_id']);
    $sql = "UPDATE reservations SET status='fulfilled' WHERE id=$reservation_id";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "Reservation fulfilled"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error fulfilling reservation: " . $conn->error]);
    }

} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>
