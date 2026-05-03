# EC Healthcare - Doctor Reports & Feedback Portal

A role-based healthcare management system with an admin dashboard for managing patient reports and feedback.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: PHP
- Database: MySQL / MariaDB

## Setup

1. Clone the repo and place it in your web server directory (e.g. `C:\xampp\htdocs\doctor-portal`)

2. Create the database:
```sql
CREATE DATABASE ec_healthcare;
```

3. Import the schema:
```bash
mysql -u root -p ec_healthcare < database/schema.sql
```

4. Configure database connection:
```bash
cp php/config.example.php php/config.php
# Edit php/config.php with your credentials
```

5. Access at `http://localhost/doctor-portal`

## Default Login
- Username: `admin`
- Password: `admin123`

## Features
- Role-based authentication (Admin, Doctor, User)
- Dashboard with statistics and charts
- Patient report management
- Feedback system with ratings
- User management (admin only)
