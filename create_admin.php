<?php
// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "themis_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Hash the password (using PHP's password_hash function)
$hashed_password = password_hash("admin123", PASSWORD_DEFAULT);

// Current timestamp
$current_time = date("Y-m-d H:i:s");

// Check if admin user already exists
$check_sql = "SELECT * FROM users WHERE username = 'admin'";
$result = $conn->query($check_sql);

if ($result->num_rows > 0) {
    echo "Admin user already exists!";
} else {
    // SQL to insert admin user
    $sql = "INSERT INTO users (username, email, full_name, password_hash, role, created_at, updated_at) 
            VALUES ('admin', 'admin@example.com', 'Administrator', '$hashed_password', 'admin', '$current_time', '$current_time')";

    if ($conn->query($sql) === TRUE) {
        echo "Admin user created successfully!";
    } else {
        echo "Error: " . $sql . "<br>" . $conn->error;
    }
}

$conn->close();
?>