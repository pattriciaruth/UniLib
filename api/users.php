<?php
// api/users.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database config
require_once __DIR__ . "/../config/config.php";
$conn = getDbConnection();

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);

switch ($action) {

    // ===============================
    // 🧾 REGISTER USER
    // ===============================
    case 'register':
        if (!isset($data['name'], $data['email'], $data['password'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing required fields"]);
            exit;
        }

        $name = trim($data['name']);
        $email = trim($data['email']);
        $password = password_hash($data['password'], PASSWORD_BCRYPT);
        $role = 'student'; // default role

        // Check for duplicate email
        $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $check->bind_param("s", $email);
        $check->execute();
        $check->store_result();

        if ($check->num_rows > 0) {
            echo json_encode(["status" => "error", "message" => "Email already registered"]);
            exit;
        }

        // Insert user
        $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $name, $email, $password, $role);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "User registered successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
        }
        break;

    // ===============================
    // 🔑 LOGIN USER
    // ===============================
    case 'login':
        if (!isset($data['email'], $data['password'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing email or password"]);
            exit;
        }

        $email = trim($data['email']);
        $password = $data['password'];

        $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "User not found"]);
            exit;
        }

        $user = $result->fetch_assoc();
        if (!password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid password"]);
            exit;
        }

        echo json_encode([
            "status" => "success",
            "message" => "Login successful",
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role" => $user['role']
            ]
        ]);
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
