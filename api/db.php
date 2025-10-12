<?php
// api/db.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include config (case-sensitive on Render)
require_once __DIR__ . "/../Config/config.php";  // capital C!

try {
    // ✅ Use the secure PlanetScale connection function
    $conn = getDbConnection();

    echo json_encode([
        "status" => "success",
        "message" => "Connected to database successfully",
        "host" => DB_HOST,
        "database" => DB_NAME
    ]);

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>


