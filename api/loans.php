<?php
// api/loans.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT");
header("Access-Control-Allow-Headers: Content-Type");

// Include DB config
require_once __DIR__ . "/../config/config.php";
$conn = getDbConnection();

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? null;

if ($action === "borrow") {
    // ===============================
    // BORROW A BOOK
    // ===============================
    if (!isset($data['user_id'], $data['book_id'], $data['due_date'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
        exit;
    }

    $user_id = intval($data['user_id']);
    $book_id = intval($data['book_id']);
    $due_date = $conn->real_escape_string($data['due_date']);

    // Check if book is available
    $check = $conn->query("SELECT copies FROM books WHERE id=$book_id");
    if ($check->num_rows == 0) {
        echo json_encode(["status" => "error", "message" => "Book not found"]);
        exit;
    }
    $book = $check->fetch_assoc();
    if ($book['copies'] <= 0) {
        echo json_encode(["status" => "error", "message" => "No copies available"]);
        exit;
    }

    // Create loan record
    $sql = "INSERT INTO loans (user_id, book_id, due_date, status) 
            VALUES ($user_id, $book_id, '$due_date', 'borrowed')";
    if ($conn->query($sql)) {
        // Reduce book copies
        $conn->query("UPDATE books SET copies = copies - 1 WHERE id=$book_id");
        echo json_encode(["status" => "success", "message" => "Book borrowed successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error borrowing book: " . $conn->error]);
    }

} elseif ($action === "return") {
    // ===============================
    // RETURN A BOOK
    // ===============================
    if (!isset($data['loan_id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing loan_id"]);
        exit;
    }

    $loan_id = intval($data['loan_id']);

    // Check loan
    $loan = $conn->query("SELECT * FROM loans WHERE id=$loan_id AND returned=FALSE");
    if ($loan->num_rows == 0) {
        echo json_encode(["status" => "error", "message" => "Loan not found or already returned"]);
        exit;
    }
    $loanData = $loan->fetch_assoc();
    $book_id = $loanData['book_id'];

    // Update loan record
    $sql = "UPDATE loans 
            SET returned=TRUE, returned_at=CURDATE(), status='returned' 
            WHERE id=$loan_id";
    if ($conn->query($sql)) {
        // Increase book copies
        $conn->query("UPDATE books SET copies = copies + 1 WHERE id=$book_id");
        echo json_encode(["status" => "success", "message" => "Book returned successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error returning book: " . $conn->error]);
    }

} elseif ($action === "list") {
    // ===============================
    // LIST LOANS
    // ===============================
    $result = $conn->query("SELECT loans.*, users.name AS user_name, books.title AS book_title 
                            FROM loans
                            JOIN users ON loans.user_id = users.id
                            JOIN books ON loans.book_id = books.id
                            ORDER BY loans.loan_date DESC");

    $loans = [];
    while ($row = $result->fetch_assoc()) {
        // Check if overdue (due_date < today and not returned)
        if ($row['returned'] == 0 && strtotime($row['due_date']) < time()) {
            $row['status'] = 'overdue';
        }
        $loans[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $loans]);

} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>
