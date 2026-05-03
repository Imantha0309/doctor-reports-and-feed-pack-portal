<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!isLoggedIn()) { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit(); }

$action = $_REQUEST['action'] ?? '';

switch ($action) {
    case 'me':                  getMe();                break;
    // ── Admin / Doctor ──────────────────────────────
    case 'stats':               getStats();             break;
    case 'reports':             getReports();           break;
    case 'create_report':       createReport();         break;
    case 'update_report':       updateReport();         break;
    case 'delete_report':       deleteReport();         break;
    case 'feedbacks':           getFeedbacks();         break;
    case 'update_feedback':     updateFeedback();       break;
    case 'delete_feedback':     deleteFeedback();       break;
    case 'patients':            getPatients();          break;
    // ── Admin only ──────────────────────────────────
    case 'users':               getUsers();             break;
    case 'create_user':         createUser();           break;
    case 'update_user':         updateUser();           break;
    case 'delete_user':         deleteUser();           break;
    // ── Patient ─────────────────────────────────────
    case 'get_doctors':         getDoctorsList();       break;
    case 'my_reports':          getMyReports();         break;
    case 'my_feedbacks':        getMyFeedbacks();       break;
    case 'submit_feedback':     submitFeedback();       break;
    case 'update_my_feedback':  updateMyFeedback();     break;
    case 'delete_my_feedback':  deleteMyFeedback();     break;
    default: echo json_encode(['success'=>false,'message'=>'Invalid action']);
}

// ── Shared ────────────────────────────────────────────────────────────────────
function getMe() {
    echo json_encode(['success'=>true,'data'=>[
        'id'        => $_SESSION['user_id'],
        'username'  => $_SESSION['username'],
        'role'      => $_SESSION['role'],
        'full_name' => $_SESSION['full_name'] ?? ''
    ]]);
}

function getDoctorsList() {
    global $conn;
    $r = mysqli_query($conn,
        "SELECT d.id, u.full_name, d.specialization
         FROM doctors d JOIN users u ON d.user_id=u.id ORDER BY u.full_name");
    $rows=[];
    while ($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function getStats() {
    global $conn;
    if (!isAdminOrDoctor()) { echo json_encode(['success'=>false,'message'=>'Access denied']); return; }
    $s = [];
    $s['total_users']     = mysqli_fetch_assoc(mysqli_query($conn,"SELECT COUNT(*) c FROM users"))['c'];
    $s['total_doctors']   = mysqli_fetch_assoc(mysqli_query($conn,"SELECT COUNT(*) c FROM doctors"))['c'];
    $s['total_reports']   = mysqli_fetch_assoc(mysqli_query($conn,"SELECT COUNT(*) c FROM reports"))['c'];
    $s['total_feedbacks'] = mysqli_fetch_assoc(mysqli_query($conn,"SELECT COUNT(*) c FROM feedbacks"))['c'];
    $r = mysqli_query($conn,"SELECT role, COUNT(*) count FROM users GROUP BY role");
    $s['user_breakdown']=[];
    while ($row=mysqli_fetch_assoc($r)) $s['user_breakdown'][]=$row;
    $r = mysqli_query($conn,"SELECT DATE(created_at) date, COUNT(*) count FROM reports WHERE created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date");
    $s['reports_trend']=[];
    while ($row=mysqli_fetch_assoc($r)) $s['reports_trend'][]=$row;
    echo json_encode(['success'=>true,'data'=>$s]);
}

// ── Reports CRUD ──────────────────────────────────────────────────────────────
function getReports() {
    global $conn;
    if (!isAdminOrDoctor()) { echo json_encode(['success'=>false,'message'=>'Access denied']); return; }
    $r = mysqli_query($conn,
        "SELECT r.*, u.full_name patient_name, d.specialization, du.full_name doctor_name
         FROM reports r
         LEFT JOIN users u   ON r.patient_id=u.id
         LEFT JOIN doctors d ON r.doctor_id=d.id
         LEFT JOIN users du  ON d.user_id=du.id
         ORDER BY r.created_at DESC");
    $rows=[];
    while ($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function createReport() {
    global $conn;
    if (!isAdminOrDoctor()) { echo json_encode(['success'=>false,'message'=>'Access denied']); return; }
    $title  = trim($_POST['title']       ?? '');
    $desc   = trim($_POST['description'] ?? '');
    $diag   = trim($_POST['diagnosis']   ?? '');
    $pid    = intval($_POST['patient_id'] ?? 0);
    $status = in_array($_POST['status']??'', ['pending','reviewed','completed']) ? $_POST['status'] : 'pending';
    if (!$title) { echo json_encode(['success'=>false,'message'=>'Title is required']); return; }
    $uid = $_SESSION['user_id'];
    $res = mysqli_query($conn,"SELECT id FROM doctors WHERE user_id=$uid LIMIT 1");
    $doc = mysqli_fetch_assoc($res); $did = $doc ? $doc['id'] : null;
    $p = $pid ?: null;
    $stmt = mysqli_prepare($conn,"INSERT INTO reports (patient_id,doctor_id,title,description,diagnosis,status) VALUES (?,?,?,?,?,?)");
    mysqli_stmt_bind_param($stmt,'iissss',$p,$did,$title,$desc,$diag,$status);
    mysqli_stmt_execute($stmt); $id=mysqli_insert_id($conn); mysqli_stmt_close($stmt);
    echo json_encode(['success'=>true,'id'=>$id]);
}

function updateReport() {
    global $conn;
    if (!isAdminOrDoctor()) { echo json_encode(['success'=>false,'message'=>'Access denied']); return; }
    $id     = intval($_POST['id']          ?? 0);
    $title  = trim($_POST['title']         ?? '');
    $desc   = trim($_POST['description']   ?? '');
    $diag   = trim($_POST['diagnosis']     ?? '');
    $status = $_POST['status']             ?? '';
    $pid    = intval($_POST['patient_id']  ?? 0) ?: null;
    if (!$id || !$title) { echo json_encode(['success'=>false,'message'=>'ID and title required']); return; }
    if (!in_array($status,['pending','reviewed','completed'])) { echo json_encode(['success'=>false,'message'=>'Invalid status']); return; }
    $stmt = mysqli_prepare($conn,"UPDATE reports SET title=?,description=?,diagnosis=?,status=?,patient_id=? WHERE id=?");
    mysqli_stmt_bind_param($stmt,'ssssii',$title,$desc,$diag,$status,$pid,$id);
    mysqli_stmt_execute($stmt); mysqli_stmt_close($stmt);
    echo json_encode(['success'=>true]);
}

function deleteReport() {
    global $conn;
    if (!isAdminOrDoctor()) { echo json_encode(['success'=>false,'message'=>'Access denied']); return; }
    $id = intval($_POST['id'] ?? 0);
    if (!$id) { echo json_encode(['success'=>false,'message'=>'Invalid ID']); return; }
    $stmt = mysqli_prepare($conn,"DELETE FROM reports WHERE id=?");
    mysqli_stmt_bind_param($stmt,'i',$id);
    mysqli_stmt_execute($stmt);
    echo json_encode(['success'=>mysqli_stmt_affected_rows($stmt)>0]);
    mysqli_stmt_close($stmt);
}

// ── Feedbacks CRUD ────────────────────────────────────────────────────────────
function getFeedbacks() {
    global $conn;
    if (!isAdminOrDoctor()) { echo json_encode(['success'=>false,'message'=>'Access denied']); return; }
    $r = mysqli_query($conn,
        "SELECT f.*, u.full_name user_name, du.full_name doctor_name, d.specialization
         FROM feedbacks f
         LEFT JOIN users u   ON f.user_id=u.id
         LEFT JOIN doctors d ON f.doctor_id=d.id
         LEFT JOIN users du  ON d.user_id=du.id
         ORDER BY f.created_at DESC");
    $rows=[];
    while ($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function updateFeedback() {
    global $conn;
    if (!isAdminOrDoctor()) { echo json_encode(['success'=>false,'message'=>'Access denied']); return; }
    $id = intval($_POST['id'] ?? 0);
    $st = $_POST['status'] ?? '';
    if (!$id || !in_array($st,['new','reviewed','resolved'])) { echo json_encode(['success'=>false,'message'=>'Invalid']); return; }
    $stmt = mysqli_prepare($conn,"UPDATE feedbacks SET status=? WHERE id=?");
    mysqli_stmt_bind_param($stmt,'si',$st,$id);
    mysqli_stmt_execute($stmt);
    echo json_encode(['success'=>mysqli_stmt_affected_rows($stmt)>0]);
    mysqli_stmt_close($stmt);
}

function deleteFeedback() {
    global $conn;
    if (!hasRole('admin')) { echo json_encode(['success'=>false,'message'=>'Admin only']); return; }
    $id = intval($_POST['id'] ?? 0);
    if (!$id) { echo json_encode(['success'=>false,'message'=>'Invalid ID']); return; }
    $stmt = mysqli_prepare($conn,"DELETE FROM feedbacks WHERE id=?");
    mysqli_stmt_bind_param($stmt,'i',$id);
    mysqli_stmt_execute($stmt);
    echo json_encode(['success'=>mysqli_stmt_affected_rows($stmt)>0]);
    mysqli_stmt_close($stmt);
}

// ── Users CRUD (admin only) ───────────────────────────────────────────────────
function getUsers() {
    global $conn;
    if (!hasRole('admin')) { echo json_encode(['success'=>false,'message'=>'Admin only']); return; }
    $r = mysqli_query($conn,"SELECT id,username,email,role,full_name,created_at FROM users ORDER BY created_at DESC");
    $rows=[];
    while ($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function getPatients() {
    global $conn;
    if (!isAdminOrDoctor()) { echo json_encode(['success'=>false,'message'=>'Access denied']); return; }
    $r = mysqli_query($conn,"SELECT id,full_name,username FROM users WHERE role='user' ORDER BY full_name");
    $rows=[];
    while ($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function createUser() {
    global $conn;
    if (!hasRole('admin')) { echo json_encode(['success'=>false,'message'=>'Admin only']); return; }
    $username  = trim($_POST['username']  ?? '');
    $email     = trim($_POST['email']     ?? '');
    $full_name = trim($_POST['full_name'] ?? '');
    $password  = $_POST['password']       ?? '';
    $role      = $_POST['role']           ?? 'user';
    if (!$username||!$email||!$password||!$full_name) { echo json_encode(['success'=>false,'message'=>'All fields required']); return; }
    if (!filter_var($email,FILTER_VALIDATE_EMAIL))    { echo json_encode(['success'=>false,'message'=>'Invalid email']); return; }
    if (!in_array($role,['admin','doctor','user']))    { echo json_encode(['success'=>false,'message'=>'Invalid role']); return; }
    // check duplicate
    $chk = mysqli_prepare($conn,"SELECT id FROM users WHERE username=? OR email=?");
    mysqli_stmt_bind_param($chk,'ss',$username,$email); mysqli_stmt_execute($chk); mysqli_stmt_store_result($chk);
    if (mysqli_stmt_num_rows($chk)>0) { echo json_encode(['success'=>false,'message'=>'Username or email already taken']); mysqli_stmt_close($chk); return; }
    mysqli_stmt_close($chk);
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = mysqli_prepare($conn,"INSERT INTO users (username,email,password,full_name,role) VALUES (?,?,?,?,?)");
    mysqli_stmt_bind_param($stmt,'sssss',$username,$email,$hashed,$full_name,$role);
    mysqli_stmt_execute($stmt); $new_id=mysqli_insert_id($conn); mysqli_stmt_close($stmt);
    // if doctor, create doctors row
    if ($role==='doctor') {
        $spec = trim($_POST['specialization'] ?? '');
        $lic  = trim($_POST['license']        ?? '');
        $ph   = trim($_POST['phone']          ?? '');
        $s2 = mysqli_prepare($conn,"INSERT INTO doctors (user_id,specialization,license_number,phone) VALUES (?,?,?,?)");
        mysqli_stmt_bind_param($s2,'isss',$new_id,$spec,$lic,$ph);
        mysqli_stmt_execute($s2); mysqli_stmt_close($s2);
    }
    echo json_encode(['success'=>true,'id'=>$new_id]);
}

function updateUser() {
    global $conn;
    if (!hasRole('admin')) { echo json_encode(['success'=>false,'message'=>'Admin only']); return; }
    $id        = intval($_POST['id']        ?? 0);
    $full_name = trim($_POST['full_name']   ?? '');
    $email     = trim($_POST['email']       ?? '');
    $role      = $_POST['role']             ?? '';
    if (!$id||!$full_name||!$email) { echo json_encode(['success'=>false,'message'=>'Required fields missing']); return; }
    if (!in_array($role,['admin','doctor','user'])) { echo json_encode(['success'=>false,'message'=>'Invalid role']); return; }
    $stmt = mysqli_prepare($conn,"UPDATE users SET full_name=?,email=?,role=? WHERE id=?");
    mysqli_stmt_bind_param($stmt,'sssi',$full_name,$email,$role,$id);
    mysqli_stmt_execute($stmt); mysqli_stmt_close($stmt);
    // update password if provided
    $pw = $_POST['password'] ?? '';
    if ($pw) {
        $h = password_hash($pw, PASSWORD_DEFAULT);
        $s2 = mysqli_prepare($conn,"UPDATE users SET password=? WHERE id=?");
        mysqli_stmt_bind_param($s2,'si',$h,$id); mysqli_stmt_execute($s2); mysqli_stmt_close($s2);
    }
    echo json_encode(['success'=>true]);
}

function deleteUser() {
    global $conn;
    if (!hasRole('admin')) { echo json_encode(['success'=>false,'message'=>'Admin only']); return; }
    $id = intval($_POST['id'] ?? 0);
    if (!$id) { echo json_encode(['success'=>false,'message'=>'Invalid ID']); return; }
    // prevent self-delete
    if ($id === intval($_SESSION['user_id'])) { echo json_encode(['success'=>false,'message'=>'Cannot delete your own account']); return; }
    $stmt = mysqli_prepare($conn,"DELETE FROM users WHERE id=?");
    mysqli_stmt_bind_param($stmt,'i',$id);
    mysqli_stmt_execute($stmt);
    echo json_encode(['success'=>mysqli_stmt_affected_rows($stmt)>0]);
    mysqli_stmt_close($stmt);
}

// ── Patient CRUD ──────────────────────────────────────────────────────────────
function getMyReports() {
    global $conn;
    $uid = intval($_SESSION['user_id']);
    $r = mysqli_query($conn,
        "SELECT r.id,r.title,r.description,r.diagnosis,r.status,r.created_at,
                d.specialization, u.full_name doctor_name
         FROM reports r
         LEFT JOIN doctors d ON r.doctor_id=d.id
         LEFT JOIN users u   ON d.user_id=u.id
         WHERE r.patient_id=$uid ORDER BY r.created_at DESC");
    $rows=[];
    while ($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function getMyFeedbacks() {
    global $conn;
    $uid = intval($_SESSION['user_id']);
    $r = mysqli_query($conn,
        "SELECT f.id,f.subject,f.message,f.rating,f.status,f.created_at,
                u.full_name doctor_name, d.specialization
         FROM feedbacks f
         LEFT JOIN doctors d ON f.doctor_id=d.id
         LEFT JOIN users u   ON d.user_id=u.id
         WHERE f.user_id=$uid ORDER BY f.created_at DESC");
    $rows=[];
    while ($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function submitFeedback() {
    global $conn;
    $uid     = intval($_SESSION['user_id']);
    $did     = intval($_POST['doctor_id'] ?? 0) ?: null;
    $subject = trim($_POST['subject'] ?? '');
    $message = trim($_POST['message'] ?? '');
    $rating  = intval($_POST['rating'] ?? 0);
    if (!$message) { echo json_encode(['success'=>false,'message'=>'Message is required']); return; }
    if ($rating<1||$rating>5) { echo json_encode(['success'=>false,'message'=>'Please select a rating']); return; }
    $stmt = mysqli_prepare($conn,"INSERT INTO feedbacks (user_id,doctor_id,subject,message,rating,status) VALUES (?,?,?,?,?,'new')");
    mysqli_stmt_bind_param($stmt,'iissi',$uid,$did,$subject,$message,$rating);
    mysqli_stmt_execute($stmt); $id=mysqli_insert_id($conn); mysqli_stmt_close($stmt);
    echo json_encode(['success'=>true,'id'=>$id]);
}

function updateMyFeedback() {
    global $conn;
    $uid     = intval($_SESSION['user_id']);
    $id      = intval($_POST['id']      ?? 0);
    $subject = trim($_POST['subject']   ?? '');
    $message = trim($_POST['message']   ?? '');
    $rating  = intval($_POST['rating']  ?? 0);
    $did     = intval($_POST['doctor_id'] ?? 0) ?: null;
    if (!$id||!$message) { echo json_encode(['success'=>false,'message'=>'Message is required']); return; }
    if ($rating<1||$rating>5) { echo json_encode(['success'=>false,'message'=>'Invalid rating']); return; }
    // only owner can edit, and only if status is 'new'
    $chk = mysqli_query($conn,"SELECT id FROM feedbacks WHERE id=$id AND user_id=$uid AND status='new'");
    if (!mysqli_num_rows($chk)) { echo json_encode(['success'=>false,'message'=>'Cannot edit this feedback']); return; }
    $stmt = mysqli_prepare($conn,"UPDATE feedbacks SET subject=?,message=?,rating=?,doctor_id=? WHERE id=? AND user_id=?");
    mysqli_stmt_bind_param($stmt,'ssiiii',$subject,$message,$rating,$did,$id,$uid);
    mysqli_stmt_execute($stmt); mysqli_stmt_close($stmt);
    echo json_encode(['success'=>true]);
}

function deleteMyFeedback() {
    global $conn;
    $uid = intval($_SESSION['user_id']);
    $id  = intval($_POST['id'] ?? 0);
    if (!$id) { echo json_encode(['success'=>false,'message'=>'Invalid ID']); return; }
    // only owner can delete, and only if status is 'new'
    $chk = mysqli_query($conn,"SELECT id FROM feedbacks WHERE id=$id AND user_id=$uid AND status='new'");
    if (!mysqli_num_rows($chk)) { echo json_encode(['success'=>false,'message'=>'Cannot delete this feedback']); return; }
    $stmt = mysqli_prepare($conn,"DELETE FROM feedbacks WHERE id=? AND user_id=?");
    mysqli_stmt_bind_param($stmt,'ii',$id,$uid);
    mysqli_stmt_execute($stmt);
    echo json_encode(['success'=>mysqli_stmt_affected_rows($stmt)>0]);
    mysqli_stmt_close($stmt);
}
?>
