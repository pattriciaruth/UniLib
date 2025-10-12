<?php
// api/reports.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include DB config
require_once __DIR__ . "/../Config/config.php";
$conn = getDbConnection();

$action = $_GET['action'] ?? '';
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

// ===============================
// 🔒 ADMIN-ONLY ACCESS CHECK
// ===============================
if (!$user_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing user_id"]);
    exit;
}

$check = $conn->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
$check->bind_param("i", $user_id);
$check->execute();
$result = $check->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "User not found"]);
    exit;
}

$role = $result->fetch_assoc()['role'];
if ($role !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Admins only."]);
    exit;
}

// ===============================
// 📊 HANDLE REPORT ACTIONS
// ===============================
switch ($action) {

    // 📈 REPORT 1: LIBRARY USAGE SUMMARY
    case 'usage':
        $queries = [
            "total_users" => "SELECT COUNT(*) AS count FROM users",
            "total_books" => "SELECT COUNT(*) AS count FROM books",
            "active_loans" => "SELECT COUNT(*) AS count FROM loans WHERE returned=0",
            "reservations" => "SELECT COUNT(*) AS count FROM reservations",
            "unpaid_fines" => "SELECT COUNT(*) AS count FROM fines WHERE paid=0"
        ];

        $report = [];
        foreach ($queries as $key => $sql) {
            $res = $conn->query($sql);
            $report[$key] = $res ? $res->fetch_assoc()['count'] : 0;
        }

        echo json_encode(["status" => "success", "report" => $report]);
        break;

    // 📅 REPORT 2: OVERDUE LOANS
    case 'overdue':
        $today = date("Y-m-d");

        $stmt = $conn->prepare("
            SELECT l.id AS loan_id, u.name AS user_name, u.email, b.title AS book_title, 
                   l.due_date, l.returned
            FROM loans l
            JOIN users u ON l.user_id = u.id
            JOIN books b ON l.book_id = b.id
            WHERE l.returned = 0 AND l.due_date < ?
            ORDER BY l.due_date ASC
        ");
        $stmt->bind_param("s", $today);
        $stmt->execute();
        $overdue = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode(["status" => "success", "overdue" => $overdue]);
        break;

    // 📚 REPORT 3: MOST POPULAR BOOKS
    case 'popular_books':
        $sql = "
            SELECT b.title, COUNT(l.id) AS borrow_count
            FROM loans l
            JOIN books b ON l.book_id = b.id
            GROUP BY b.id
            ORDER BY borrow_count DESC
            LIMIT 5
        ";
        $result = $conn->query($sql);
        $popular = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];

        echo json_encode(["status" => "success", "popular_books" => $popular]);
        break;

    // 👤 REPORT 4: USER ACTIVITY (Loans + Fines)
    case 'user_activity':
        $stmt = $conn->prepare("SELECT COUNT(*) AS total_loans FROM loans WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $loan_count = $stmt->get_result()->fetch_assoc()['total_loans'];

        $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) AS total_fines FROM fines WHERE user_id = ? AND paid = 0");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $fine_total = $stmt->get_result()->fetch_assoc()['total_fines'];

        echo json_encode([
            "status" => "success",
            "user_activity" => [
                "user_id" => $user_id,
                "total_loans" => $loan_count,
                "unpaid_fines" => $fine_total
            ]
        ]);
        break;

    // 🚫 INVALID ACTION
    default:
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>
