<?php
require_once 'config.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

if ($action === 'login') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!$username || !$password) {
        echo json_encode(['success' => false, 'message' => 'Please fill all fields']);
        exit();
    }

    $stmt = mysqli_prepare($conn, "SELECT id, username, password, role, full_name FROM users WHERE username = ? OR email = ?");
    mysqli_stmt_bind_param($stmt, "ss", $username, $username);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    if ($row = mysqli_fetch_assoc($result)) {
        if (password_verify($password, $row['password'])) {
            $_SESSION['user_id']   = $row['id'];
            $_SESSION['username']  = $row['username'];
            $_SESSION['role']      = $row['role'];
            $_SESSION['full_name'] = $row['full_name'];
            echo json_encode(['success' => true, 'role' => $row['role'], 'name' => $row['full_name']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    mysqli_stmt_close($stmt);
    exit();
}

if ($action === 'register') {
    $username  = trim($_POST['username'] ?? '');
    $email     = trim($_POST['email'] ?? '');
    $full_name = trim($_POST['full_name'] ?? '');
    $password  = $_POST['password'] ?? '';

    if (!$username || !$email || !$password || !$full_name) {
        echo json_encode(['success' => false, 'message' => 'Please fill all fields']);
        exit();
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit();
    }

    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit();
    }

    // Check duplicate
    $stmt = mysqli_prepare($conn, "SELECT id FROM users WHERE username = ? OR email = ?");
    mysqli_stmt_bind_param($stmt, "ss", $username, $email);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);
    if (mysqli_stmt_num_rows($stmt) > 0) {
        echo json_encode(['success' => false, 'message' => 'Username or email already taken']);
        mysqli_stmt_close($stmt);
        exit();
    }
    mysqli_stmt_close($stmt);

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = mysqli_prepare($conn, "INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, 'user')");
    mysqli_stmt_bind_param($stmt, "ssss", $username, $email, $hashed, $full_name);
    mysqli_stmt_execute($stmt);
    $new_id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);

    $_SESSION['user_id']   = $new_id;
    $_SESSION['username']  = $username;
    $_SESSION['role']      = 'user';
    $_SESSION['full_name'] = $full_name;

    echo json_encode(['success' => true, 'name' => $full_name]);
    exit();
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit();
}

if ($action === 'register_doctor') {
    $username       = trim($_POST['username']       ?? '');
    $email          = trim($_POST['email']          ?? '');
    $full_name      = trim($_POST['full_name']      ?? '');
    $password       = $_POST['password']            ?? '';
    $specialization = trim($_POST['specialization'] ?? '');
    $license        = trim($_POST['license']        ?? '');
    $phone          = trim($_POST['phone']          ?? '');

    if (!$username || !$email || !$password || !$full_name || !$specialization) {
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
        exit();
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit();
    }
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit();
    }

    $stmt = mysqli_prepare($conn, "SELECT id FROM users WHERE username = ? OR email = ?");
    mysqli_stmt_bind_param($stmt, "ss", $username, $email);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);
    if (mysqli_stmt_num_rows($stmt) > 0) {
        echo json_encode(['success' => false, 'message' => 'Username or email already taken']);
        mysqli_stmt_close($stmt); exit();
    }
    mysqli_stmt_close($stmt);

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = mysqli_prepare($conn, "INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, 'doctor')");
    mysqli_stmt_bind_param($stmt, "ssss", $username, $email, $hashed, $full_name);
    mysqli_stmt_execute($stmt);
    $new_id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($conn, "INSERT INTO doctors (user_id, specialization, license_number, phone) VALUES (?, ?, ?, ?)");
    mysqli_stmt_bind_param($stmt, "isss", $new_id, $specialization, $license, $phone);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    $_SESSION['user_id']   = $new_id;
    $_SESSION['username']  = $username;
    $_SESSION['role']      = 'doctor';
    $_SESSION['full_name'] = $full_name;

    echo json_encode(['success' => true, 'role' => 'doctor', 'name' => $full_name]);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
