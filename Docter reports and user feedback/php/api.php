<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit();
}

$action = $_REQUEST['action'] ?? '';

switch ($action) {
    case 'me':                  getMe();               break;
    case 'get_doctors':         getDoctorsList();      break;
    case 'my_reports':          getMyReports();        break;
    case 'my_feedbacks':        getMyFeedbacks();      break;
    case 'submit_feedback':     submitFeedback();      break;
    case 'update_my_feedback':  updateMyFeedback();    break;
    case 'delete_my_feedback':  deleteMyFeedback();    break;
    default: echo json_encode(['success'=>false,'message'=>'Invalid action']);
}

function getMe() {
    $u=currentUser();
    echo json_encode(['success'=>true,'data'=>[
        'id'=>$u['user_id'],'username'=>$u['username'],
        'role'=>$u['role'],'full_name'=>$u['full_name']??''
    ]]);
}

function getDoctorsList() {
    global $conn;
    $r=mysqli_query($conn,
        "SELECT d.id,u.full_name,d.specialization FROM doctors d JOIN users u ON d.user_id=u.id ORDER BY u.full_name");
    $rows=[];
    while($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function getMyReports() {
    global $conn;
    $uid=intval($_SESSION['user_id']);
    $r=mysqli_query($conn,
        "SELECT r.id,r.title,r.description,r.diagnosis,r.status,r.created_at,
                d.specialization,u.full_name AS doctor_name
         FROM reports r
         LEFT JOIN doctors d ON r.doctor_id=d.id
         LEFT JOIN users u   ON d.user_id=u.id
         WHERE r.patient_id=$uid ORDER BY r.created_at DESC");
    $rows=[];
    while($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function getMyFeedbacks() {
    global $conn;
    $uid=intval($_SESSION['user_id']);
    $r=mysqli_query($conn,
        "SELECT f.id,f.subject,f.message,f.rating,f.status,f.created_at,f.doctor_id,
                u.full_name AS doctor_name,d.specialization
         FROM feedbacks f
         LEFT JOIN doctors d ON f.doctor_id=d.id
         LEFT JOIN users u   ON d.user_id=u.id
         WHERE f.user_id=$uid ORDER BY f.created_at DESC");
    $rows=[];
    while($row=mysqli_fetch_assoc($r)) $rows[]=$row;
    echo json_encode(['success'=>true,'data'=>$rows]);
}

function submitFeedback() {
    global $conn;
    $uid     = intval($_SESSION['user_id']);
    $did     = intval($_POST['doctor_id']??0)?:null;
    $subject = trim($_POST['subject']??'');
    $message = trim($_POST['message']??'');
    $rating  = intval($_POST['rating']??0);
    if(!$message){echo json_encode(['success'=>false,'message'=>'Message is required']);return;}
    if($rating<1||$rating>5){echo json_encode(['success'=>false,'message'=>'Please select a rating']);return;}
    $stmt=mysqli_prepare($conn,"INSERT INTO feedbacks (user_id,doctor_id,subject,message,rating,status) VALUES (?,?,?,?,?,'new')");
    mysqli_stmt_bind_param($stmt,'iissi',$uid,$did,$subject,$message,$rating);
    mysqli_stmt_execute($stmt); $id=mysqli_insert_id($conn); mysqli_stmt_close($stmt);
    echo json_encode(['success'=>true,'id'=>$id]);
}

function updateMyFeedback() {
    global $conn;
    $uid     = intval($_SESSION['user_id']);
    $id      = intval($_POST['id']??0);
    $subject = trim($_POST['subject']??'');
    $message = trim($_POST['message']??'');
    $rating  = intval($_POST['rating']??0);
    $did     = intval($_POST['doctor_id']??0)?:null;
    if(!$id||!$message){echo json_encode(['success'=>false,'message'=>'Message is required']);return;}
    if($rating<1||$rating>5){echo json_encode(['success'=>false,'message'=>'Invalid rating']);return;}
    // only owner can edit while status is 'new'
    $chk=mysqli_query($conn,"SELECT id FROM feedbacks WHERE id=$id AND user_id=$uid AND status='new'");
    if(!mysqli_num_rows($chk)){echo json_encode(['success'=>false,'message'=>'Cannot edit this feedback']);return;}
    $stmt=mysqli_prepare($conn,"UPDATE feedbacks SET subject=?,message=?,rating=?,doctor_id=? WHERE id=? AND user_id=?");
    mysqli_stmt_bind_param($stmt,'ssiiii',$subject,$message,$rating,$did,$id,$uid);
    mysqli_stmt_execute($stmt); mysqli_stmt_close($stmt);
    echo json_encode(['success'=>true]);
}

function deleteMyFeedback() {
    global $conn;
    $uid=$_SESSION['user_id'];
    $id=intval($_POST['id']??0);
    if(!$id){echo json_encode(['success'=>false,'message'=>'Invalid ID']);return;}
    // only owner, only while 'new'
    $chk=mysqli_query($conn,"SELECT id FROM feedbacks WHERE id=$id AND user_id=$uid AND status='new'");
    if(!mysqli_num_rows($chk)){echo json_encode(['success'=>false,'message'=>'Cannot delete this feedback']);return;}
    $stmt=mysqli_prepare($conn,"DELETE FROM feedbacks WHERE id=? AND user_id=?");
    mysqli_stmt_bind_param($stmt,'ii',$id,$uid);
    mysqli_stmt_execute($stmt);
    echo json_encode(['success'=>mysqli_stmt_affected_rows($stmt)>0]);
    mysqli_stmt_close($stmt);
}
?>
