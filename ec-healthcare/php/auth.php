<?php
require_once 'config.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

if ($action === 'login') {
    $u = trim($_POST['username'] ?? '');
    $p = $_POST['password'] ?? '';
    if (!$u || !$p) { echo json_encode(['success'=>false,'message'=>'Please fill all fields']); exit(); }

    $stmt = mysqli_prepare($conn, "SELECT id,username,password,role,full_name FROM users WHERE username=? OR email=?");
    mysqli_stmt_bind_param($stmt,'ss',$u,$u);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if ($row && password_verify($p, $row['password'])) {
        $_SESSION['user_id']=$row['id']; $_SESSION['username']=$row['username'];
        $_SESSION['role']=$row['role'];  $_SESSION['full_name']=$row['full_name'];
        echo json_encode(['success'=>true,'role'=>$row['role'],'name'=>$row['full_name']]);
    } else {
        echo json_encode(['success'=>false,'message'=>'Invalid username or password']);
    }
    exit();
}

if ($action === 'register') {
    $fn=$_POST['full_name']??''; $u=$_POST['username']??''; $e=$_POST['email']??''; $p=$_POST['password']??'';
    if (!$fn||!$u||!$e||!$p) { echo json_encode(['success'=>false,'message'=>'Please fill all fields']); exit(); }
    if (!filter_var($e,FILTER_VALIDATE_EMAIL)) { echo json_encode(['success'=>false,'message'=>'Invalid email']); exit(); }
    if (strlen($p)<6) { echo json_encode(['success'=>false,'message'=>'Password must be at least 6 characters']); exit(); }

    $stmt=mysqli_prepare($conn,"SELECT id FROM users WHERE username=? OR email=?");
    mysqli_stmt_bind_param($stmt,'ss',$u,$e); mysqli_stmt_execute($stmt); mysqli_stmt_store_result($stmt);
    if (mysqli_stmt_num_rows($stmt)>0) { echo json_encode(['success'=>false,'message'=>'Username or email already taken']); mysqli_stmt_close($stmt); exit(); }
    mysqli_stmt_close($stmt);

    $h=password_hash($p,PASSWORD_DEFAULT);
    $stmt=mysqli_prepare($conn,"INSERT INTO users (username,email,password,full_name,role) VALUES (?,?,?,?,'user')");
    mysqli_stmt_bind_param($stmt,'ssss',$u,$e,$h,$fn); mysqli_stmt_execute($stmt);
    $id=mysqli_insert_id($conn); mysqli_stmt_close($stmt);

    $_SESSION['user_id']=$id; $_SESSION['username']=$u; $_SESSION['role']='user'; $_SESSION['full_name']=$fn;
    echo json_encode(['success'=>true,'role'=>'user','name'=>$fn]);
    exit();
}

if ($action === 'logout') { session_destroy(); echo json_encode(['success'=>true]); exit(); }

if ($action === 'register_doctor') {
    $fn   = trim($_POST['full_name']      ?? '');
    $u    = trim($_POST['username']       ?? '');
    $e    = trim($_POST['email']          ?? '');
    $p    = $_POST['password']            ?? '';
    $spec = trim($_POST['specialization'] ?? '');
    $lic  = trim($_POST['license']        ?? '');
    $ph   = trim($_POST['phone']          ?? '');

    if (!$fn||!$u||!$e||!$p||!$spec) { echo json_encode(['success'=>false,'message'=>'Please fill all required fields']); exit(); }
    if (!filter_var($e,FILTER_VALIDATE_EMAIL)) { echo json_encode(['success'=>false,'message'=>'Invalid email']); exit(); }
    if (strlen($p)<6) { echo json_encode(['success'=>false,'message'=>'Password must be at least 6 characters']); exit(); }

    $stmt=mysqli_prepare($conn,"SELECT id FROM users WHERE username=? OR email=?");
    mysqli_stmt_bind_param($stmt,'ss',$u,$e); mysqli_stmt_execute($stmt); mysqli_stmt_store_result($stmt);
    if (mysqli_stmt_num_rows($stmt)>0) { echo json_encode(['success'=>false,'message'=>'Username or email already taken']); mysqli_stmt_close($stmt); exit(); }
    mysqli_stmt_close($stmt);

    $h=password_hash($p,PASSWORD_DEFAULT);
    $stmt=mysqli_prepare($conn,"INSERT INTO users (username,email,password,full_name,role) VALUES (?,?,?,?,'doctor')");
    mysqli_stmt_bind_param($stmt,'ssss',$u,$e,$h,$fn); mysqli_stmt_execute($stmt);
    $id=mysqli_insert_id($conn); mysqli_stmt_close($stmt);

    $stmt=mysqli_prepare($conn,"INSERT INTO doctors (user_id,specialization,license_number,phone) VALUES (?,?,?,?)");
    mysqli_stmt_bind_param($stmt,'isss',$id,$spec,$lic,$ph); mysqli_stmt_execute($stmt); mysqli_stmt_close($stmt);

    $_SESSION['user_id']=$id; $_SESSION['username']=$u; $_SESSION['role']='doctor'; $_SESSION['full_name']=$fn;
    echo json_encode(['success'=>true,'role'=>'doctor','name'=>$fn]);
    exit();
}

echo json_encode(['success'=>false,'message'=>'Invalid action']);
?>
