<?php
// api/loans.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Include DB config (case-sensitive path)
require_once __DIR__ . "/../Config/config.php";  // capital C!
$conn = getDbConnection();

// Handle preflight OPTIONS request (for CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? null;

switch ($action) {

    // ===============================
    // 📚 BORROW A BOOK
    // ===============================
    case "borrow":
        if (!isset($data['user_id'], $data['book_id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing required fields"]);
            exit;
        }

        $user_id = intval($data['user_id']);
        $book_id = intval($data['book_id']);
        $due_date = isset($data['due_date'])
            ? $conn->real_escape_string($data['due_date'])
            : date("Y-m-d", strtotime("+14 days"));

        // Check if book exists and available
        $stmt = $conn->prepare("SELECT copies FROM books WHERE id=?");
        $stmt->bind_param("i", $book_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(["status" => "error", "message" => "Book not found"]);
            exit;
        }

        $book = $result->fetch_assoc();
        if ($book['copies'] <= 0) {
            echo json_encode(["status" => "error", "message" => "No copies available. Please reserve instead."]);
            exit;
        }

        // Borrow the book
        $stmt = $conn->prepare("INSERT INTO loans (user_id, book_id, due_date, status) VALUES (?, ?, ?, 'borrowed')");
        $stmt->bind_param("iis", $user_id, $book_id, $due_date);

        if ($stmt->execute()) {
            // Safely reduce available copies
            $conn->query("UPDATE books SET copies = GREATEST(copies - 1, 0) WHERE id=$book_id");

            // Mark any active reservation as fulfilled
            $conn->query("UPDATE reservations 
                          SET status='fulfilled' 
                          WHERE user_id=$user_id AND book_id=$book_id AND status='active' 
                          ORDER BY reservation_date ASC LIMIT 1");

            echo json_encode([
                "status" => "success",
                "message" => "Book borrowed successfully! Due on $due_date"
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error borrowing book: " . $conn->error]);
        }
        break;

    // ===============================
    // 🔙 RETURN A BOOK
    // ===============================
    case "return":
        if (!isset($data['loan_id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing loan_id"]);
            exit;
        }

        $loan_id = intval($data['loan_id']);

        $loan = $conn->prepare("SELECT * FROM loans WHERE id=? AND returned=FALSE");
        $loan->bind_param("i", $loan_id);
        $loan->execute();
        $result = $loan->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(["status" => "error", "message" => "Loan not found or already returned"]);
            exit;
        }

        $loanData = $result->fetch_assoc();
        $book_id = $loanData['book_id'];

        $update = $conn->prepare("UPDATE loans SET returned=TRUE, returned_at=CURDATE(), status='returned' WHERE id=?");
        $update->bind_param("i", $loan_id);

        if ($update->execute()) {
            // Increase copies again
            $conn->query("UPDATE books SET copies = copies + 1 WHERE id=$book_id");

            // Fulfill next reservation if exists
            $reservation = $conn->query("SELECT id FROM reservations WHERE book_id=$book_id AND status='active' ORDER BY reservation_date ASC LIMIT 1");
            if ($reservation->num_rows > 0) {
                $res = $reservation->fetch_assoc();
                $res_id = $res['id'];
                $conn->query("UPDATE reservations SET status='fulfilled' WHERE id=$res_id");
            }

            echo json_encode(["status" => "success", "message" => "Book returned successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error returning book: " . $conn->error]);
        }
        break;

    // ===============================
    // 📋 LIST LOANS (OPTIONAL user_id filter)
    // ===============================
    case "list":
        $user_id = $_GET['user_id'] ?? null;

        if ($user_id) {
            $stmt = $conn->prepare("SELECT loans.*, books.title AS book_title 
                                    FROM loans 
                                    JOIN books ON loans.book_id = books.id 
                                    WHERE loans.user_id = ?
                                    ORDER BY loans.loan_date DESC");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query("SELECT loans.*, users.name AS user_name, books.title AS book_title 
                                    FROM loans 
                                    JOIN users ON loans.user_id = users.id 
                                    JOIN books ON loans.book_id = books.id 
                                    ORDER BY loans.loan_date DESC");
        }

        $loans = [];
        while ($row = $result->fetch_assoc()) {
            if ($row['returned'] == 0 && strtotime($row['due_date']) < time()) {
                $row['status'] = 'overdue';
            }
            $loans[] = $row;
        }

        echo json_encode(["status" => "success", "loans" => $loans]);
        break;

    // ===============================
    // 🆕 STUDENT SELF RETURN OPTION
    // ===============================
    case "student_return":
        if (!isset($data['user_id'], $data['book_id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing user_id or book_id"]);
            exit;
        }

        $user_id = intval($data['user_id']);
        $book_id = intval($data['book_id']);

        $loan = $conn->prepare("SELECT id FROM loans WHERE user_id=? AND book_id=? AND returned=FALSE LIMIT 1");
        $loan->bind_param("ii", $user_id, $book_id);
        $loan->execute();
        $result = $loan->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(["status" => "error", "message" => "No active loan found for this book"]);
            exit;
        }

        $loan_id = $result->fetch_assoc()['id'];
        $update = $conn->prepare("UPDATE loans SET returned=TRUE, returned_at=CURDATE(), status='returned' WHERE id=?");
        $update->bind_param("i", $loan_id);

        if ($update->execute()) {
            $conn->query("UPDATE books SET copies = copies + 1 WHERE id=$book_id");
            echo json_encode(["status" => "success", "message" => "Book returned successfully by student"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error returning book: " . $conn->error]);
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
