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

$action   = $_GET['action'] ?? '';
$user_id  = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

// 🔒 Admin check
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

    // 📈 USAGE SUMMARY
    case 'usage':
        $queries = [
            "total_users"   => "SELECT COUNT(*) AS count FROM users",
            "total_books"   => "SELECT COUNT(*) AS count FROM books",
            "active_loans"  => "SELECT COUNT(*) AS count FROM loans WHERE returned=0",
            "reservations"  => "SELECT COUNT(*) AS count FROM reservations",
            "unpaid_fines"  => "SELECT COUNT(*) AS count FROM fines WHERE paid=0"
        ];

        $report = [];
        foreach ($queries as $key => $sql) {
            $res = $conn->query($sql);
            $report[$key] = $res ? $res->fetch_assoc()['count'] : 0;
        }

        echo json_encode(["status" => "success", "report" => $report]);
        break;

    // 📅 OVERDUE LOANS
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

        echo json_encode(["status" => "success", "report" => $overdue]);
        break;

    // 📚 POPULAR BOOKS
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

        echo json_encode(["status" => "success", "report" => $popular]);
        break;

    // 👤 USER ACTIVITY
    case 'user_activity':
        $targetUserId = isset($_GET['target_user_id']) ? intval($_GET['target_user_id']) : null;
        if (!$targetUserId) {
            echo json_encode(["status" => "error", "message" => "Missing target_user_id"]);
            exit;
        }

        // Fetch loan count and unpaid fines for target user
        $stmt = $conn->prepare("SELECT COUNT(*) AS total_loans FROM loans WHERE user_id = ?");
        $stmt->bind_param("i", $targetUserId);
        $stmt->execute();
        $loan_count = $stmt->get_result()->fetch_assoc()['total_loans'] ?? 0;

        $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) AS total_fines FROM fines WHERE user_id = ? AND paid = 0");
        $stmt->bind_param("i", $targetUserId);
        $stmt->execute();
        $fine_total = $stmt->get_result()->fetch_assoc()['total_fines'] ?? 0;

        // Fetch recent loans with book titles
        $stmt = $conn->prepare("
            SELECT b.title AS book_title, l.loan_date, l.due_date, 
                   CASE 
                       WHEN l.returned = 1 THEN 'Returned'
                       WHEN l.due_date < CURDATE() THEN 'Overdue'
                       ELSE 'Borrowed'
                   END AS status
            FROM loans l
            JOIN books b ON l.book_id = b.id
            WHERE l.user_id = ?
            ORDER BY l.loan_date DESC
            LIMIT 10
        ");
        $stmt->bind_param("i", $targetUserId);
        $stmt->execute();
        $loan_history = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "status" => "success",
            "report" => [
                "user_id"      => $targetUserId,
                "total_loans"  => $loan_count,
                "unpaid_fines" => $fine_total,
                "loan_history" => $loan_history
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
