<?php
// config/config.php — PlanetScale + Render compatible

define('DB_HOST', getenv('DB_HOST'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));
define('DB_NAME', getenv('DB_NAME'));

function getDbConnection() {
    $conn = mysqli_init();

    // Explicitly tell mysqli to require SSL
    mysqli_options($conn, MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, true);
    mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL);

    if (!mysqli_real_connect(
        $conn,
        DB_HOST,
        DB_USER,
        DB_PASS,
        DB_NAME,
        3306,
        NULL,
        MYSQLI_CLIENT_SSL_DONT_VERIFY_SERVER_CERT // ✅ Key change for Render+PlanetScale
    )) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Database connection failed: " . mysqli_connect_error()
        ]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    return $conn;
}
?>

