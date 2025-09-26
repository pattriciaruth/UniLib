<?php
// api/fines.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");

// Include database config
require_once __DIR__ . "/../config/config.php";
$conn = getDbConnection();

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? null;

if ($action === "calculate") {
    // ===============================
    // CALCULATE FINES FOR OVERDUE LOANS
    // ===============================
    $today = date("Y-m-d");
    $fineRate = 1.00; // $1 per day late

    $sql = "SELECT l.id AS loan_id, l.user_id, l.due_date, l.returned, l.returned_at
            FROM loans l
            WHERE (l.returned = 0 AND l.due_date < '$today')
               OR (l.returned = 1 AND l.returned_at > l.due_date)";

    $result = $conn->query($sql);
    $created = 0;

    while ($row = $result->fetch_assoc()) {
        $dueDate = new DateTime($row['due_date']);
        $endDate = $row['returned'] ? new DateTime($row['returned_at']) : new DateTime($today);
        $daysLate = $endDate->diff($dueDate)->days;

        if ($daysLate > 0) {
            $amount = $daysLate * $fineRate;

            // Avoid duplicate fines for the same loan
            $check = $conn->query("SELECT id FROM fines WHERE loan_id={$row['loan_id']} LIMIT 1");
            if ($check->num_rows == 0) {
                $stmt = $conn->prepare("INSERT INTO fines (user_id, loan_id, amount) VALUES (?, ?, ?)");
                $stmt->bind_param("iid", $row['user_id'], $row['loan_id'], $amount);
                $stmt->execute();
                $created++;
            }
        }
    }

    echo json_encode(["status" => "success", "message" => "$created fines calculated"]);

} elseif ($action === "list") {
    // ===============================
    // GET FINES FOR A USER
    // ===============================
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing user_id"]);
        exit;
    }

    $user_id = intval($_GET['user_id']);
    $sql = "SELECT f.id, f.amount, f.paid, f.created_at, l.book_id, b.title 
            FROM fines f
            JOIN loans l ON f.loan_id = l.id
            JOIN books b ON l.book_id = b.id
            WHERE f.user_id=$user_id";

    $result = $conn->query($sql);
    $fines = [];

    while ($row = $result->fetch_assoc()) {
        $fines[] = $row;
    }

    echo json_encode(["status" => "success", "fines" => $fines]);

} elseif ($action === "pay") {
    // ===============================
    // MARK FINE AS PAID
    // ===============================
    if (!isset($data['fine_id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing fine_id"]);
        exit;
    }

    $fine_id = intval($data['fine_id']);
    $sql = "UPDATE fines SET paid=1 WHERE id=$fine_id";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "Fine marked as paid"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error updating fine"]);
    }

} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>
