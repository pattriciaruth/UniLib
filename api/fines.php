<?php
// api/fines.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Include DB config (case-sensitive)
require_once __DIR__ . "/../Config/config.php";
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
    // 💰 LIST FINES (OPTIONAL user_id filter)
    // ===============================
    case "list":
        $user_id = $_GET['user_id'] ?? null;

        if ($user_id) {
            $stmt = $conn->prepare("SELECT fines.*, loans.book_id, books.title AS book_title
                                    FROM fines
                                    JOIN loans ON fines.loan_id = loans.id
                                    JOIN books ON loans.book_id = books.id
                                    WHERE fines.user_id = ?
                                    ORDER BY fines.created_at DESC");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query("SELECT fines.*, users.name AS user_name, books.title AS book_title
                                    FROM fines
                                    JOIN users ON fines.user_id = users.id
                                    JOIN loans ON fines.loan_id = loans.id
                                    JOIN books ON loans.book_id = books.id
                                    ORDER BY fines.created_at DESC");
        }

        $fines = [];
        while ($row = $result->fetch_assoc()) {
            $fines[] = $row;
        }

        echo json_encode(["status" => "success", "fines" => $fines]);
        break;

    // ===============================
    // ➕ ADD A FINE (admin/librarian)
    // ===============================
    case "add":
        if (!isset($data['loan_id'], $data['user_id'], $data['amount'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing required fields"]);
            exit;
        }

        $loan_id = intval($data['loan_id']);
        $user_id = intval($data['user_id']);
        $amount  = floatval($data['amount']);

        $stmt = $conn->prepare("INSERT INTO fines (loan_id, user_id, amount, paid, created_at)
                                VALUES (?, ?, ?, FALSE, NOW())");
        $stmt->bind_param("iid", $loan_id, $user_id, $amount);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Fine added successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error adding fine: " . $conn->error]);
        }
        break;

    // ===============================
    // 💸 MARK FINE AS PAID
    // ===============================
    case "pay":
        if (!isset($data['fine_id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing fine_id"]);
            exit;
        }

        $fine_id = intval($data['fine_id']);

        $stmt = $conn->prepare("UPDATE fines SET paid = TRUE, paid_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $fine_id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Fine marked as paid"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error updating fine: " . $conn->error]);
        }
        break;

    // ===============================
    // ❌ INVALID ACTION
    // ===============================
    default:
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>

