<?php
// api/reservations.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Include DB config (case-sensitive)
require_once __DIR__ . "/../Config/config.php";  // capital C!
$conn = getDbConnection();

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? null;

switch ($action) {

    // ===============================
    // 📘 MAKE A RESERVATION
    // ===============================
    case "reserve":
        if (!isset($data['user_id'], $data['book_id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing required fields"]);
            exit;
        }

        $user_id = intval($data['user_id']);
        $book_id = intval($data['book_id']);

        // Check if book exists
        $checkBook = $conn->prepare("SELECT id, copies FROM books WHERE id = ?");
        $checkBook->bind_param("i", $book_id);
        $checkBook->execute();
        $book = $checkBook->get_result()->fetch_assoc();
        if (!$book) {
            echo json_encode(["status" => "error", "message" => "Book not found"]);
            exit;
        }

        // Prevent reservation if copies are available (should borrow instead)
        if ($book['copies'] > 0) {
            echo json_encode(["status" => "error", "message" => "Book is available — please borrow it instead."]);
            exit;
        }

        // Check if already reserved
        $stmt = $conn->prepare("SELECT id FROM reservations WHERE user_id=? AND book_id=? AND status='active'");
        $stmt->bind_param("ii", $user_id, $book_id);
        $stmt->execute();
        $check = $stmt->get_result();

        if ($check->num_rows > 0) {
            echo json_encode(["status" => "error", "message" => "You already have an active reservation for this book."]);
            exit;
        }

        // Add new reservation
        $stmt = $conn->prepare("INSERT INTO reservations (user_id, book_id, status, reservation_date)
                                VALUES (?, ?, 'active', NOW())");
        $stmt->bind_param("ii", $user_id, $book_id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Book reserved successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error reserving book: " . $conn->error]);
        }
        break;

    // ===============================
    // 📋 LIST RESERVATIONS (optional user_id filter)
    // ===============================
    case "list":
        $user_id = $_GET['user_id'] ?? null;

        if ($user_id) {
            $stmt = $conn->prepare("
                SELECT r.*, b.title AS book_title, b.author, b.subject
                FROM reservations r
                JOIN books b ON r.book_id = b.id
                WHERE r.user_id = ?
                ORDER BY r.reservation_date DESC
            ");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query("
                SELECT r.*, u.name AS user_name, b.title AS book_title
                FROM reservations r
                JOIN users u ON r.user_id = u.id
                JOIN books b ON r.book_id = b.id
                ORDER BY r.reservation_date DESC
            ");
        }

        $reservations = [];
        while ($row = $result->fetch_assoc()) {
            // Friendly message for fulfilled reservations
            if ($row['status'] === 'fulfilled') {
                $row['note'] = "Your reserved book is now available to borrow!";
            }
            $reservations[] = $row;
        }

        echo json_encode(["status" => "success", "reservations" => $reservations]);
        break;

    // ===============================
    // ❌ CANCEL A RESERVATION
    // ===============================
    case "cancel":
        if (!isset($data['reservation_id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing reservation_id"]);
            exit;
        }

        $reservation_id = intval($data['reservation_id']);
        $stmt = $conn->prepare("UPDATE reservations SET status='cancelled' WHERE id=?");
        $stmt->bind_param("i", $reservation_id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Reservation cancelled"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error cancelling reservation: " . $conn->error]);
        }
        break;

    // ===============================
    // ✅ MARK RESERVATION AS FULFILLED
    // (done automatically by loans.php)
    // ===============================
    case "fulfill":
        if (!isset($data['reservation_id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing reservation_id"]);
            exit;
        }

        $reservation_id = intval($data['reservation_id']);
        $stmt = $conn->prepare("UPDATE reservations SET status='fulfilled' WHERE id=?");
        $stmt->bind_param("i", $reservation_id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Reservation fulfilled"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error fulfilling reservation: " . $conn->error]);
        }
        break;

    // ===============================
    // 🚫 INVALID ACTION
    // ===============================
    default:
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>


