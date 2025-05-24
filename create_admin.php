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

// First, check if the Roles table has entries
$check_roles = "SELECT * FROM Roles";
$roles_result = $conn->query($check_roles);

if ($roles_result->num_rows == 0) {
    // Insert roles if they don't exist
    $insert_roles = "INSERT INTO Roles (role_id, name) VALUES 
                    (1, 'Officer'),
                    (2, 'Visitor'),
                    (3, 'PUC')";
    
    if ($conn->query($insert_roles) === TRUE) {
        echo "Roles created successfully!<br>";
    } else {
        echo "Error creating roles: " . $conn->error . "<br>";
    }
}

// Current timestamp
$current_time = date("Y-m-d H:i:s");

// Check if admin user already exists
$check_admin = "SELECT * FROM Users WHERE username = 'admin'";
$admin_result = $conn->query($check_admin);

if ($admin_result->num_rows > 0) {
    echo "Admin user already exists! Updating password...<br>";
    $sql_admin = "UPDATE Users SET password_hash = 'admin123' WHERE username = 'admin'";
    if ($conn->query($sql_admin) === TRUE) {
        echo "Admin password updated successfully!<br>";
    } else {
        echo "Error updating admin password: " . $conn->error . "<br>";
    }
} else {
    // SQL to insert admin user (role_id 1 for Officer) with plain text password
    $sql_admin = "INSERT INTO Users (role_id, username, password_hash, created_at) 
                VALUES (1, 'admin', 'admin123', '$current_time')";

    if ($conn->query($sql_admin) === TRUE) {
        echo "Admin user created successfully!<br>";
    } else {
        echo "Error creating admin: " . $conn->error . "<br>";
    }
}

// Check if visitor user already exists
$check_visitor = "SELECT * FROM Users WHERE username = 'visitor'";
$visitor_result = $conn->query($check_visitor);

if ($visitor_result->num_rows > 0) {
    echo "Visitor user already exists! Updating password...<br>";
    $sql_visitor = "UPDATE Users SET password_hash = 'visitor123' WHERE username = 'visitor'";
    if ($conn->query($sql_visitor) === TRUE) {
        echo "Visitor password updated successfully!<br>";
    } else {
        echo "Error updating visitor password: " . $conn->error . "<br>";
    }
} else {
    // SQL to insert visitor user (role_id 2 for Visitor) with plain text password
    $sql_visitor = "INSERT INTO Users (role_id, username, password_hash, created_at) 
                  VALUES (2, 'visitor', 'visitor123', '$current_time')";

    if ($conn->query($sql_visitor) === TRUE) {
        echo "Visitor user created successfully!<br>";
    } else {
        echo "Error creating visitor: " . $conn->error . "<br>";
    }
}

$conn->close();
?>