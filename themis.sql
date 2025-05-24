-- --------------------------------------------------------
-- Themis Capstone Project Database Schema
-- Run this script in your MySQL/Codespace to create
-- a fresh themis_db with all tables, relationships,
-- indexes, and enums.
-- --------------------------------------------------------

-- 0. Drop & recreate the database
DROP DATABASE IF EXISTS themis_db;
CREATE DATABASE themis_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE themis_db;

-- 1. Roles
CREATE TABLE Roles (
  role_id    INT AUTO_INCREMENT PRIMARY KEY,
  name       ENUM('Officer','Visitor','PUC') NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Users (Officers only — login via biometric/PIN/password)
CREATE TABLE Users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  role_id        INT NOT NULL,
  username       VARCHAR(50) NOT NULL UNIQUE,
  password_hash  CHAR(60) NOT NULL,
  pin_hash       CHAR(60)       NULL,
  face_template  BLOB           NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login     DATETIME       NULL,
  INDEX (role_id),
  FOREIGN KEY (role_id) REFERENCES Roles(role_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Crime Categories
CREATE TABLE CrimeCategories (
  category_id  INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 4. PUPCs (Persons Under Police Custody)
CREATE TABLE PUPCs (
  pupc_id       INT AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(50) NOT NULL,
  last_name     VARCHAR(50) NOT NULL,
  gender        ENUM('Male','Female','Other') NULL,
  age           INT              NULL,
  arrest_date   DATE             NULL,
  status        VARCHAR(50)      NULL,
  category_id   INT              NULL,
  mugshot_path  VARCHAR(255)     NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (category_id),
  FOREIGN KEY (category_id) REFERENCES CrimeCategories(category_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. PUPC Status History
CREATE TABLE PUPCStatusHistory (
  history_id   INT AUTO_INCREMENT PRIMARY KEY,
  pupc_id      INT NOT NULL,
  old_status   VARCHAR(50)      NULL,
  new_status   VARCHAR(50)      NULL,
  changed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (pupc_id),
  INDEX (changed_at),
  FOREIGN KEY (pupc_id) REFERENCES PUPCs(pupc_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Visitors
CREATE TABLE Visitors (
  visitor_id           INT AUTO_INCREMENT PRIMARY KEY,
  first_name           VARCHAR(50) NOT NULL,
  last_name            VARCHAR(50) NOT NULL,
  relationship_to_puc  VARCHAR(100)    NULL,
  photo_path           VARCHAR(255)    NULL,
  registered_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Visitor Logs
CREATE TABLE VisitorLogs (
  visitor_log_id     INT AUTO_INCREMENT PRIMARY KEY,
  pupc_id            INT NOT NULL,
  visitor_id         INT NOT NULL,
  visit_time         TIME NOT NULL,
  visit_date         DATE NOT NULL,
  purpose            VARCHAR(255)    NULL,
  photo_path         VARCHAR(255)    NULL,
  approval_status    ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  approved_by        INT             NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (pupc_id),
  INDEX (visitor_id),
  INDEX (visit_date),
  FOREIGN KEY (pupc_id) REFERENCES PUPCs(pupc_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES Visitors(visitor_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES Users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- 8. Visitor Approvals
CREATE TABLE VisitorApprovals (
  approval_id      INT AUTO_INCREMENT PRIMARY KEY,
  visitor_log_id   INT NOT NULL,
  approved_by      INT NOT NULL,
  decision         ENUM('Approved','Rejected') NOT NULL,
  decision_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remarks          VARCHAR(255)    NULL,
  INDEX (visitor_log_id),
  INDEX (approved_by),
  FOREIGN KEY (visitor_log_id) REFERENCES VisitorLogs(visitor_log_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (approved_by)    REFERENCES Users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 9. Blacklist
CREATE TABLE Blacklist (
  black_id     INT AUTO_INCREMENT PRIMARY KEY,
  pupc_id      INT             NULL,
  visitor_id   INT             NULL,
  reason       VARCHAR(255)    NULL,
  added_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_black (pupc_id, visitor_id),
  FOREIGN KEY (pupc_id) REFERENCES PUPCs(pupc_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES Visitors(visitor_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Audit Logs
CREATE TABLE AuditLogs (
  audit_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT             NULL,
  event_type   VARCHAR(50)     NULL,
  event_time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address   VARCHAR(45)     NULL,
  notes        TEXT            NULL,
  INDEX (user_id),
  INDEX (event_time),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Notifications
CREATE TABLE Notifications (
  notif_id          INT AUTO_INCREMENT PRIMARY KEY,
  target_user_id    INT             NULL,
  target_visitor_id INT             NULL,
  type              ENUM('POPUP','SMS','EMAIL','ALARM','OTHER') NOT NULL,
  message           TEXT            NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at           DATETIME        NULL,
  status            ENUM('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending',
  INDEX (target_user_id),
  INDEX (target_visitor_id),
  FOREIGN KEY (target_user_id)    REFERENCES Users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  FOREIGN KEY (target_visitor_id) REFERENCES Visitors(visitor_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;
