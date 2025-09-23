<?php
// api/db.php
header("Content-Type: application/json; charset=UTF-8");

// include config (with DB credentials)
include_once __DIR__ . "/../config/config.php";

// Try connecting to database
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

// ✅ If connection is OK
echo json_encode([
    "status" => "success",
    "message" => "Connected to database successfully"
]);

$conn->close();
?>
