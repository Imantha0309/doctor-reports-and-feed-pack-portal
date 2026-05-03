<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'root');
define('DB_NAME', 'ec_healthcare');

$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if (!$conn) die(json_encode(['success' => false, 'message' => 'DB error: ' . mysqli_connect_error()]));
mysqli_set_charset($conn, 'utf8');

if (session_status() === PHP_SESSION_NONE) session_start();

function isLoggedIn()      { return isset($_SESSION['user_id']); }
function hasRole($r)       { return isset($_SESSION['role']) && $_SESSION['role'] === $r; }
function isAdminOrDoctor() { return hasRole('admin') || hasRole('doctor'); }
?>
