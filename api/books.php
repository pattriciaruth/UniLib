<?php
// api/books.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Include DB config (case-sensitive path for Render)
require_once __DIR__ . "/../Config/config.php";
$conn = getDbConnection();

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);

switch ($action) {

    // ===============================
    // 📚 LIST ALL BOOKS
    // ===============================
    case 'list':
        $result = $conn->query("SELECT * FROM books ORDER BY created_at DESC");
        $books = $result->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "status" => "success",
            "books" => $books
        ]);
        break;

    // ===============================
    // 🔍 SEARCH BOOKS (by title, author, or subject)
    // ===============================
    case 'search':
        $query = $_GET['q'] ?? '';
        $like = "%" . $query . "%";

        $stmt = $conn->prepare("
            SELECT * FROM books 
            WHERE title LIKE ? OR author LIKE ? OR subject LIKE ?
            ORDER BY created_at DESC
        ");
        $stmt->bind_param("sss", $like, $like, $like);
        $stmt->execute();
        $result = $stmt->get_result();
        $books = $result->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "status" => "success",
            "books" => $books
        ]);
        break;

    // ===============================
    // ➕ ADD A NEW BOOK
    // ===============================
    case 'add':
        if (!isset($data['title'], $data['author'], $data['isbn'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing required fields"]);
            exit;
        }

        $stmt = $conn->prepare("
            INSERT INTO books (title, author, subject, available, isbn, published_year, copies) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $available = isset($data['available']) ? (int)$data['available'] : 1;
        $year = $data['published_year'] ?? null;
        $copies = $data['copies'] ?? 1;

        $stmt->bind_param(
            "sssissi",
            $data['title'],
            $data['author'],
            $data['subject'],
            $available,
            $data['isbn'],
            $year,
            $copies
        );

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Book added successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error adding book: " . $conn->error]);
        }
        break;

    // ===============================
    // ✏️ EDIT AN EXISTING BOOK
    // ===============================
    case 'edit':
        $id = intval($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Book ID required"]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE books 
            SET title=?, author=?, subject=?, available=?, isbn=?, published_year=?, copies=? 
            WHERE id=?
        ");
        $available = isset($data['available']) ? (int)$data['available'] : 1;
        $year = $data['published_year'] ?? null;
        $copies = $data['copies'] ?? 1;

        $stmt->bind_param(
            "sssissii",
            $data['title'],
            $data['author'],
            $data['subject'],
            $available,
            $data['isbn'],
            $year,
            $copies,
            $id
        );

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Book updated successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error updating book: " . $conn->error]);
        }
        break;

    // ===============================
    // ❌ DELETE A BOOK
    // ===============================
    case 'delete':
        $id = intval($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Book ID required"]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM books WHERE id=?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Book deleted successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error deleting book: " . $conn->error]);
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

