<?php
// config/config.sample.php
// Example configuration - edit and rename to config.php

define('DB_HOST', 'localhost');   
define('DB_USER', 'root'); 
define('DB_PASS', ''); 
define('DB_NAME', 'unilib');       

// Example: $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
// Function to return a DB connection
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        die("Database connection failed: " . $conn->connect_error);
    }

    $conn->set_charset("utf8mb4");
    return $conn;
}
?>
