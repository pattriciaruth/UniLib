<?php
// config/config.php

define('DB_HOST', getenv('DB_HOST'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));
define('DB_NAME', getenv('DB_NAME'));

function getDbConnection() {
    $conn = mysqli_init();

    // Required for PlanetScale SSL connection
    mysqli_ssl_set($conn, NULL, NULL, "/etc/ssl/certs/ca-certificates.crt", NULL, NULL);

    if (!mysqli_real_connect(
        $conn,
        DB_HOST,
        DB_USER,
        DB_PASS,
        DB_NAME,
        3306,
        NULL,
        MYSQLI_CLIENT_SSL
    )) {
        die("Database connection failed: " . mysqli_connect_error());
    }

    $conn->set_charset("utf8mb4");
    return $conn;
}
?>
