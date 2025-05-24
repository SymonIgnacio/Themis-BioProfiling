-- --------------------------------------------
-- Themis: Bio-Profiling Criminal Record System
-- Clean database setup for development
-- --------------------------------------------

-- 1. Drop and recreate the database
DROP DATABASE IF EXISTS themis_db;
CREATE DATABASE themis_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE themis_db;

-- 2. Roles
CREATE TABLE Roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  name ENUM('Admin','Officer','Visitor','PUC') NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3. Users
CREATE TABLE Users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  role_id        INT NOT NULL,
  username       VARCHAR(50) NOT NULL UNIQUE,
  password_hash  CHAR(64) NOT NULL,
  pin_hash       CHAR(64),
  face_template  BLOB,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login     DATETIME,
  FOREIGN KEY (role_id) REFERENCES Roles(role_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. Crime Categories
CREATE TABLE CrimeCategories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 5. PUPCs
CREATE TABLE PUPCs (
  pupc_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  gender ENUM('Male','Female','Other'),
  age INT,
  arrest_date DATE,
  status VARCHAR(50),
  category_id INT,
  mugshot_path VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES CrimeCategories(category_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. PUPC Status History
CREATE TABLE PUPCStatusHistory (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  pupc_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pupc_id) REFERENCES PUPCs(pupc_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Visitors
CREATE TABLE Visitors (
  visitor_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  relationship_to_puc VARCHAR(100),
  photo_path VARCHAR(255),
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Visitor Logs
CREATE TABLE VisitorLogs (
  visitor_log_id INT AUTO_INCREMENT PRIMARY KEY,
  pupc_id INT NOT NULL,
  visitor_id INT NOT NULL,
  visit_time TIME NOT NULL,
  visit_date DATE NOT NULL,
  purpose VARCHAR(255),
  photo_path VARCHAR(255),
  approval_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  approved_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pupc_id) REFERENCES PUPCs(pupc_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES Visitors(visitor_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES Users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. Visitor Approvals
CREATE TABLE VisitorApprovals (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  visitor_log_id INT NOT NULL,
  approved_by INT NOT NULL,
  decision ENUM('Approved','Rejected') NOT NULL,
  decision_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  remarks VARCHAR(255),
  FOREIGN KEY (visitor_log_id) REFERENCES VisitorLogs(visitor_log_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES Users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. Blacklist
CREATE TABLE Blacklist (
  black_id INT AUTO_INCREMENT PRIMARY KEY,
  pupc_id INT,
  visitor_id INT,
  reason VARCHAR(255),
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_black (pupc_id, visitor_id),
  FOREIGN KEY (pupc_id) REFERENCES PUPCs(pupc_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES Visitors(visitor_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Audit Logs
CREATE TABLE AuditLogs (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  event_type VARCHAR(50),
  event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- 12. Notifications
CREATE TABLE Notifications (
  notif_id INT AUTO_INCREMENT PRIMARY KEY,
  target_user_id INT,
  target_visitor_id INT,
  type ENUM('POPUP','SMS','EMAIL','ALARM','OTHER') NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  status ENUM('Pending','Sent','Failed') DEFAULT 'Pending',
  FOREIGN KEY (target_user_id) REFERENCES Users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (target_visitor_id) REFERENCES Visitors(visitor_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- --------------------------------------------
-- Seed Roles and Dev Users
-- --------------------------------------------

-- Seed Roles
INSERT INTO Roles (name) VALUES
  ('Admin'),
  ('Officer'),
  ('Visitor'),
  ('PUC');

-- Create Dev Users (admin & visitor)
-- Using SHA-256 hash of 'password123'
-- Replace with bcrypt in real deployment
INSERT INTO Users (role_id, username, password_hash, created_at)
VALUES
  ((SELECT role_id FROM Roles WHERE name = 'Admin'), 'admin', SHA2('admin123', 256), NOW()),
  ((SELECT role_id FROM Roles WHERE name = 'Visitor'), 'visitor', SHA2('visitor123', 256), NOW());
