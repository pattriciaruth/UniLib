<?php
// api/users.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");

// Include database config with getDbConnection()
require_once __DIR__ . "/../config/config.php";

// Create DB connection
$conn = getDbConnection();

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? null;

if ($action === "register") {
    // ===============================
    // REGISTER USER
    // ===============================
    if (!isset($data['name'], $data['email'], $data['password'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
        exit;
    }

    $name = $conn->real_escape_string($data['name']);
    $email = $conn->real_escape_string($data['email']);
    $password = password_hash($data['password'], PASSWORD_BCRYPT); // Secure password hashing

    // Default role = student (could extend to allow librarian/admin later)
    $sql = "INSERT INTO users (name, email, password, role) VALUES ('$name', '$email', '$password', 'student')";
    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "User registered successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
    }

} elseif ($action === "login") {
    // ===============================
    // LOGIN USER
    // ===============================
    if (!isset($data['email'], $data['password'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing email or password"]);
        exit;
    }

    $email = $conn->real_escape_string($data['email']);
    $password = $data['password'];

    $sql = "SELECT * FROM users WHERE email='$email' LIMIT 1";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        if (password_verify($password, $user['password'])) {
            echo json_encode([
                "status" => "success",
                "message" => "Login successful",
                "user" => [
                    "id" => $user['id'],
                    "name" => $user['name'],
                    "email" => $user['email'],
                    "role" => $user['role'] // <-- This is how we distinguish student/librarian/admin
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid password"]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found"]);
    }

} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}

$conn->close();
?>
