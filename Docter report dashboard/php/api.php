<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'stats':
        getStats();
        break;
    case 'me':
        getMe();
        break;
    case 'reports':
        getReports();
        break;
    case 'feedbacks':
        getFeedbacks();
        break;
    case 'users':
        getUsers();
        break;
    case 'patients':
        getPatients();
        break;
    case 'update_report':
        updateReportStatus();
        break;
    case 'update_feedback':
        updateFeedbackStatus();
        break;
    case 'create_report':
        createReport();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function getMe() {
    echo json_encode(['success' => true, 'data' => [
        'id'        => $_SESSION['user_id'],
        'username'  => $_SESSION['username'],
        'role'      => $_SESSION['role'],
        'full_name' => $_SESSION['full_name'] ?? ''
    ]]);
}

function getPatients() {
    global $conn;
    // Only doctors/admins can fetch patient list for report creation
    if (!hasRole('doctor') && !hasRole('admin')) {
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        return;
    }
    $result = mysqli_query($conn, "SELECT id, full_name, username FROM users WHERE role = 'user' ORDER BY full_name");
    $patients = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $patients[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $patients]);
}

function createReport() {
    global $conn;

    if (!hasRole('doctor') && !hasRole('admin')) {
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        return;
    }

    $title       = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $diagnosis   = trim($_POST['diagnosis'] ?? '');
    $patient_id  = intval($_POST['patient_id'] ?? 0);

    if (empty($title)) {
        echo json_encode(['success' => false, 'message' => 'Title is required']);
        return;
    }

    // Resolve doctor_id from logged-in user
    $user_id = $_SESSION['user_id'];
    $res = mysqli_query($conn, "SELECT id FROM doctors WHERE user_id = $user_id LIMIT 1");
    $doc = mysqli_fetch_assoc($res);
    $doctor_id = $doc ? $doc['id'] : null;

    $stmt = mysqli_prepare($conn,
        "INSERT INTO reports (patient_id, doctor_id, title, description, diagnosis, status) VALUES (?, ?, ?, ?, ?, 'pending')"
    );
    $pid = $patient_id ?: null;
    mysqli_stmt_bind_param($stmt, "iisss", $pid, $doctor_id, $title, $description, $diagnosis);
    mysqli_stmt_execute($stmt);
    $new_id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);

    echo json_encode(['success' => true, 'id' => $new_id]);
}

function getStats() {
    global $conn;
    
    $stats = [];
    
    // Total users
    $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM users");
    $row = mysqli_fetch_assoc($result);
    $stats['total_users'] = $row['count'];
    
    // Total doctors
    $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM doctors");
    $row = mysqli_fetch_assoc($result);
    $stats['total_doctors'] = $row['count'];
    
    // Total reports
    $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM reports");
    $row = mysqli_fetch_assoc($result);
    $stats['total_reports'] = $row['count'];
    
    // Total feedbacks
    $result = mysqli_query($conn, "SELECT COUNT(*) as count FROM feedbacks");
    $row = mysqli_fetch_assoc($result);
    $stats['total_feedbacks'] = $row['count'];
    
    // User type breakdown
    $result = mysqli_query($conn, "SELECT role, COUNT(*) as count FROM users GROUP BY role");
    $stats['user_breakdown'] = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $stats['user_breakdown'][] = $row;
    }
    
    // Reports last 30 days
    $result = mysqli_query($conn, "SELECT DATE(created_at) as date, COUNT(*) as count FROM reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date");
    $stats['reports_trend'] = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $stats['reports_trend'][] = $row;
    }
    
    echo json_encode(['success' => true, 'data' => $stats]);
}

function getReports() {
    global $conn;
    
    $query = "SELECT r.*, u.full_name as patient_name, d.specialization 
              FROM reports r 
              LEFT JOIN users u ON r.patient_id = u.id 
              LEFT JOIN doctors d ON r.doctor_id = d.id 
              ORDER BY r.created_at DESC";
    
    $result = mysqli_query($conn, $query);
    $reports = [];
    
    while ($row = mysqli_fetch_assoc($result)) {
        $reports[] = $row;
    }
    
    echo json_encode(['success' => true, 'data' => $reports]);
}

function getFeedbacks() {
    global $conn;
    
    $query = "SELECT f.*, u.full_name as user_name 
              FROM feedbacks f 
              LEFT JOIN users u ON f.user_id = u.id 
              ORDER BY f.created_at DESC";
    
    $result = mysqli_query($conn, $query);
    $feedbacks = [];
    
    while ($row = mysqli_fetch_assoc($result)) {
        $feedbacks[] = $row;
    }
    
    echo json_encode(['success' => true, 'data' => $feedbacks]);
}

function getUsers() {
    global $conn;
    
    if (!hasRole('admin')) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        return;
    }
    
    $result = mysqli_query($conn, "SELECT id, username, email, role, full_name, created_at FROM users ORDER BY created_at DESC");
    $users = [];
    
    while ($row = mysqli_fetch_assoc($result)) {
        $users[] = $row;
    }
    
    echo json_encode(['success' => true, 'data' => $users]);
}

function updateReportStatus() {
    global $conn;

    $id     = intval($_POST['id'] ?? 0);
    $status = $_POST['status'] ?? '';
    $allowed = ['pending', 'reviewed', 'completed'];

    if (!$id || !in_array($status, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
        return;
    }

    $stmt = mysqli_prepare($conn, "UPDATE reports SET status = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "si", $status, $id);
    mysqli_stmt_execute($stmt);
    $affected = mysqli_stmt_affected_rows($stmt);
    mysqli_stmt_close($stmt);

    echo json_encode(['success' => $affected > 0]);
}

function updateFeedbackStatus() {
    global $conn;

    $id     = intval($_POST['id'] ?? 0);
    $status = $_POST['status'] ?? '';
    $allowed = ['new', 'reviewed', 'resolved'];

    if (!$id || !in_array($status, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
        return;
    }

    $stmt = mysqli_prepare($conn, "UPDATE feedbacks SET status = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "si", $status, $id);
    mysqli_stmt_execute($stmt);
    $affected = mysqli_stmt_affected_rows($stmt);
    mysqli_stmt_close($stmt);

    echo json_encode(['success' => $affected > 0]);
}
?>
