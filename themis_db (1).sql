-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 24, 2025 at 09:35 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `themis_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `auditlogs`
--

CREATE TABLE `auditlogs` (
  `audit_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `event_type` varchar(50) DEFAULT NULL,
  `event_time` datetime NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `auditlogs`
--

INSERT INTO `auditlogs` (`audit_id`, `user_id`, `event_type`, `event_time`, `ip_address`, `notes`) VALUES
(1, 7, 'login_success', '2025-05-25 03:22:44', '192.168.0.2', 'Officer login success'),
(2, 8, 'face_login_fail', '2025-05-25 03:22:44', '192.168.0.3', 'Fallback to PIN used');

-- --------------------------------------------------------

--
-- Table structure for table `blacklist`
--

CREATE TABLE `blacklist` (
  `black_id` int(11) NOT NULL,
  `pupc_id` int(11) DEFAULT NULL,
  `visitor_id` int(11) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `added_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `blacklist`
--

INSERT INTO `blacklist` (`black_id`, `pupc_id`, `visitor_id`, `reason`, `added_at`) VALUES
(1, 2, 2, 'Attempted entry without approval', '2025-05-25 03:22:44');

-- --------------------------------------------------------

--
-- Table structure for table `crimecategories`
--

CREATE TABLE `crimecategories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `crimecategories`
--

INSERT INTO `crimecategories` (`category_id`, `name`) VALUES
(1, 'Crimes Against Persons'),
(2, 'Crimes Against Property'),
(3, 'Drug-Related');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notif_id` int(11) NOT NULL,
  `target_user_id` int(11) DEFAULT NULL,
  `target_visitor_id` int(11) DEFAULT NULL,
  `type` enum('POPUP','SMS','EMAIL','ALARM','OTHER') NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `sent_at` datetime DEFAULT NULL,
  `status` enum('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notif_id`, `target_user_id`, `target_visitor_id`, `type`, `message`, `created_at`, `sent_at`, `status`) VALUES
(1, 7, NULL, 'POPUP', 'Visitor log approved', '2025-05-25 03:22:44', NULL, 'Pending'),
(2, NULL, 2, 'SMS', 'You are on the blacklist', '2025-05-25 03:22:44', NULL, 'Pending'),
(3, 8, NULL, 'POPUP', 'Manual override login detected', '2025-05-25 03:22:44', NULL, 'Pending');

-- --------------------------------------------------------

--
-- Table structure for table `pupcs`
--

CREATE TABLE `pupcs` (
  `pupc_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `arrest_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `mugshot_path` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pupcs`
--

INSERT INTO `pupcs` (`pupc_id`, `first_name`, `last_name`, `gender`, `age`, `arrest_date`, `status`, `category_id`, `mugshot_path`, `created_at`) VALUES
(1, 'Juan', 'Dela Cruz', 'Male', 30, '2024-05-01', 'Detained', 1, NULL, '2025-05-25 03:20:38'),
(2, 'Maria', 'Santos', 'Female', 25, '2024-04-15', 'Released', 3, NULL, '2025-05-25 03:20:38');

-- --------------------------------------------------------

--
-- Table structure for table `pupcstatushistory`
--

CREATE TABLE `pupcstatushistory` (
  `history_id` int(11) NOT NULL,
  `pupc_id` int(11) NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pupcstatushistory`
--

INSERT INTO `pupcstatushistory` (`history_id`, `pupc_id`, `old_status`, `new_status`, `changed_at`) VALUES
(1, 1, 'Processing', 'Detained', '2025-05-25 03:20:38'),
(2, 2, 'Detained', 'Released', '2025-05-25 03:20:38');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `name` enum('Admin','Officer','Visitor','PUC') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `name`) VALUES
(1, 'Admin'),
(2, 'Officer'),
(3, 'Visitor'),
(4, 'PUC');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` char(60) NOT NULL,
  `pin_hash` char(60) DEFAULT NULL,
  `face_template` blob DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `username`, `password_hash`, `pin_hash`, `face_template`, `created_at`, `last_login`) VALUES
(7, 1, 'admin', 'admin123', NULL, NULL, '2025-05-25 01:01:30', NULL),
(8, 2, 'visitor', 'visitor123', NULL, NULL, '2025-05-25 01:01:30', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `visitorapprovals`
--

CREATE TABLE `visitorapprovals` (
  `approval_id` int(11) NOT NULL,
  `visitor_log_id` int(11) NOT NULL,
  `approved_by` int(11) NOT NULL,
  `decision` enum('Approved','Rejected') NOT NULL,
  `decision_time` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `visitorapprovals`
--

INSERT INTO `visitorapprovals` (`approval_id`, `visitor_log_id`, `approved_by`, `decision`, `decision_time`, `remarks`) VALUES
(1, 1, 7, 'Approved', '2025-05-25 03:22:44', 'Cleared by officer'),
(2, 2, 8, 'Rejected', '2025-05-25 03:22:44', 'Incomplete ID');

-- --------------------------------------------------------

--
-- Table structure for table `visitorlogs`
--

CREATE TABLE `visitorlogs` (
  `visitor_log_id` int(11) NOT NULL,
  `pupc_id` int(11) NOT NULL,
  `visitor_id` int(11) NOT NULL,
  `visit_time` time NOT NULL,
  `visit_date` date NOT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `approval_status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `approved_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `visitorlogs`
--

INSERT INTO `visitorlogs` (`visitor_log_id`, `pupc_id`, `visitor_id`, `visit_time`, `visit_date`, `purpose`, `photo_path`, `approval_status`, `approved_by`, `created_at`) VALUES
(1, 1, 1, '10:00:00', '2025-05-24', 'Visit', 'visit_photos/ana_visit.jpg', 'Approved', 7, '2025-05-25 03:22:44'),
(2, 2, 2, '14:00:00', '2025-05-24', 'Deliver items', 'visit_photos/pedro_visit.jpg', 'Pending', 8, '2025-05-25 03:22:44');

-- --------------------------------------------------------

--
-- Table structure for table `visitors`
--

CREATE TABLE `visitors` (
  `visitor_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `relationship_to_puc` varchar(100) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `registered_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `visitors`
--

INSERT INTO `visitors` (`visitor_id`, `first_name`, `last_name`, `relationship_to_puc`, `photo_path`, `registered_at`) VALUES
(1, 'Ana', 'Reyes', 'Sister', 'photos/ana.jpg', '2025-05-25 03:22:44'),
(2, 'Pedro', 'Lopez', 'Friend', 'photos/pedro.jpg', '2025-05-25 03:22:44');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auditlogs`
--
ALTER TABLE `auditlogs`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `event_time` (`event_time`);

--
-- Indexes for table `blacklist`
--
ALTER TABLE `blacklist`
  ADD PRIMARY KEY (`black_id`),
  ADD UNIQUE KEY `uq_black` (`pupc_id`,`visitor_id`),
  ADD KEY `visitor_id` (`visitor_id`);

--
-- Indexes for table `crimecategories`
--
ALTER TABLE `crimecategories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notif_id`),
  ADD KEY `target_user_id` (`target_user_id`),
  ADD KEY `target_visitor_id` (`target_visitor_id`);

--
-- Indexes for table `pupcs`
--
ALTER TABLE `pupcs`
  ADD PRIMARY KEY (`pupc_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `pupcstatushistory`
--
ALTER TABLE `pupcstatushistory`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `pupc_id` (`pupc_id`),
  ADD KEY `changed_at` (`changed_at`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `visitorapprovals`
--
ALTER TABLE `visitorapprovals`
  ADD PRIMARY KEY (`approval_id`),
  ADD KEY `visitor_log_id` (`visitor_log_id`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `visitorlogs`
--
ALTER TABLE `visitorlogs`
  ADD PRIMARY KEY (`visitor_log_id`),
  ADD KEY `pupc_id` (`pupc_id`),
  ADD KEY `visitor_id` (`visitor_id`),
  ADD KEY `visit_date` (`visit_date`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `visitors`
--
ALTER TABLE `visitors`
  ADD PRIMARY KEY (`visitor_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `auditlogs`
--
ALTER TABLE `auditlogs`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `blacklist`
--
ALTER TABLE `blacklist`
  MODIFY `black_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `crimecategories`
--
ALTER TABLE `crimecategories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notif_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pupcs`
--
ALTER TABLE `pupcs`
  MODIFY `pupc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `pupcstatushistory`
--
ALTER TABLE `pupcstatushistory`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `visitorapprovals`
--
ALTER TABLE `visitorapprovals`
  MODIFY `approval_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `visitorlogs`
--
ALTER TABLE `visitorlogs`
  MODIFY `visitor_log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `visitors`
--
ALTER TABLE `visitors`
  MODIFY `visitor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auditlogs`
--
ALTER TABLE `auditlogs`
  ADD CONSTRAINT `auditlogs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `blacklist`
--
ALTER TABLE `blacklist`
  ADD CONSTRAINT `blacklist_ibfk_1` FOREIGN KEY (`pupc_id`) REFERENCES `pupcs` (`pupc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `blacklist_ibfk_2` FOREIGN KEY (`visitor_id`) REFERENCES `visitors` (`visitor_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`target_visitor_id`) REFERENCES `visitors` (`visitor_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `pupcs`
--
ALTER TABLE `pupcs`
  ADD CONSTRAINT `pupcs_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `crimecategories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `pupcstatushistory`
--
ALTER TABLE `pupcstatushistory`
  ADD CONSTRAINT `pupcstatushistory_ibfk_1` FOREIGN KEY (`pupc_id`) REFERENCES `pupcs` (`pupc_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON UPDATE CASCADE;

--
-- Constraints for table `visitorapprovals`
--
ALTER TABLE `visitorapprovals`
  ADD CONSTRAINT `visitorapprovals_ibfk_1` FOREIGN KEY (`visitor_log_id`) REFERENCES `visitorlogs` (`visitor_log_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `visitorapprovals_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `visitorlogs`
--
ALTER TABLE `visitorlogs`
  ADD CONSTRAINT `visitorlogs_ibfk_1` FOREIGN KEY (`pupc_id`) REFERENCES `pupcs` (`pupc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `visitorlogs_ibfk_2` FOREIGN KEY (`visitor_id`) REFERENCES `visitors` (`visitor_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `visitorlogs_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
