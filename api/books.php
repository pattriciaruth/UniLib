<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Include DB config
include_once __DIR__ . "/../Config/config.php";

// Connect to database
$conn = getDbConnection();

// Determine action (list, search, add, edit, delete)
$action = $_GET['action'] ?? '';

switch ($action) {

    // 📖 List all books
    case 'list':
        $result = $conn->query("SELECT * FROM books ORDER BY created_at DESC");
        $books = $result->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $books
        ]);
        break;

    // 🔍 Search books by title, author, or subject
    case 'search':
        $query = $_GET['q'] ?? '';
        $stmt = $conn->prepare("SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR subject LIKE ?");
        $like = "%" . $query . "%";
        $stmt->bind_param("sss", $like, $like, $like);
        $stmt->execute();
        $result = $stmt->get_result();
        $books = $result->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $books
        ]);
        break;

    // ➕ Add a new book
    case 'add':
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['title'], $data['author'], $data['isbn'])) {
            echo json_encode(["status" => "error", "message" => "Missing required fields"]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO books (title, author, subject, available, isbn, published_year, copies) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "sssissi",
            $data['title'],
            $data['author'],
            $data['subject'],
            $data['available'],
            $data['isbn'],
            $data['published_year'],
            $data['copies']
        );

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Book added successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Error adding book: " . $conn->error]);
        }
        break;

    // ✏️ Edit book
    case 'edit':
        $id = $_GET['id'] ?? 0;
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$id) {
            echo json_encode(["status" => "error", "message" => "Book ID required"]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE books SET title=?, author=?, subject=?, available=?, isbn=?, published_year=?, copies=? WHERE id=?");
        $stmt->bind_param(
            "sssissii",
            $data['title'],
            $data['author'],
            $data['subject'],
            $data['available'],
            $data['isbn'],
            $data['published_year'],
            $data['copies'],
            $id
        );

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Book updated successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Error updating book: " . $conn->error]);
        }
        break;

    // ❌ Delete book
    case 'delete':
        $id = $_GET['id'] ?? 0;

        if (!$id) {
            echo json_encode(["status" => "error", "message" => "Book ID required"]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM books WHERE id=?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Book deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Error deleting book: " . $conn->error]);
        }
        break;

    // 🚫 Invalid action
    default:
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
}
?>
