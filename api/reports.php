<?php
// api/reports.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

//admin only report check
$user_id = $_GET['user_id'] ?? null;

if ($user_id) {
    $check = $conn->query("SELECT role FROM users WHERE id=$user_id LIMIT 1");
    $role = $check->fetch_assoc()['role'] ?? null;

    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Access denied. Admin only."]);
        exit;
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing user_id"]);
    exit;
}


// Include DB config
require_once __DIR__ . "/../config/config.php";
$conn = getDbConnection();

$action = $_GET['action'] ?? null;

if ($action === "usage") {
    // ===============================
    // REPORT 1: LIBRARY USAGE
    // ===============================
    $sql = [
        "total_users" => "SELECT COUNT(*) AS count FROM users",
        "total_books" => "SELECT COUNT(*) AS count FROM books",
        "active_loans" => "SELECT COUNT(*) AS count FROM loans WHERE returned=0",
        "reservations" => "SELECT COUNT(*) AS count FROM reservations",
        "fines_unpaid" => "SELECT COUNT(*) AS count FROM fines WHERE paid=0"
    ];

    $report = [];
    foreach ($sql as $key => $query) {
        $res = $conn->query($query);
        $row = $res->fetch_assoc();
        $report[$key] = $row['count'];
    }

    echo json_encode(["status" => "success", "usage_report" => $report]);

} elseif ($action === "overdue") {
    // ===============================
    // REPORT 2: OVERDUE LOANS
    // ===============================
    $today = date("Y-m-d");
    $sql = "SELECT l.id AS loan_id, u.name AS user_name, u.email, b.title AS book_title, 
                   l.due_date, l.returned
            FROM loans l
            JOIN users u ON l.user_id = u.id
            JOIN books b ON l.book_id = b.id
            WHERE l.returned = 0 AND l.due_date < '$today'";

    $result = $conn->query($sql);
    $overdue = [];
    while ($row = $result->fetch_assoc()) {
        $overdue[] = $row;
    }

    echo json_encode(["status" => "success", "overdue_loans" => $overdue]);

} elseif ($action === "popular_books") {
    // ===============================
    // REPORT 3: MOST BORROWED BOOKS
    // ===============================
    $sql = "SELECT b.title, COUNT(l.id) AS borrow_count
            FROM loans l
            JOIN books b ON l.book_id = b.id
            GROUP BY b.id
            ORDER BY borrow_count DESC
            LIMIT 5";

    $result = $conn->query($sql);
    $popular = [];
    while ($row = $result->fetch_assoc()) {
        $popular[] = $row;
    }

    echo json_encode(["status" => "success", "popular_books" => $popular]);

} elseif ($action === "user_activity") {
    // ===============================
    // REPORT 4: USER ACTIVITY (loans + fines)
    // ===============================
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing user_id"]);
        exit;
    }

    $user_id = intval($_GET['user_id']);

    // Count loans
    $loan_sql = "SELECT COUNT(*) AS loan_count FROM loans WHERE user_id=$user_id";
    $loan_count = $conn->query($loan_sql)->fetch_assoc()['loan_count'];

    // Count unpaid fines
    $fine_sql = "SELECT SUM(amount) AS total_fines FROM fines WHERE user_id=$user_id AND paid=0";
    $fine_total = $conn->query($fine_sql)->fetch_assoc()['total_fines'] ?? 0;

    echo json_encode([
        "status" => "success",
        "user_activity" => [
            "user_id" => $user_id,
            "total_loans" => $loan_count,
            "unpaid_fines" => $fine_total
        ]
    ]);

} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>
