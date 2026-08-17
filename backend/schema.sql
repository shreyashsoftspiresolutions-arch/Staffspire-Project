-- ==============================================================================
-- Staffspire Employee Management System (HRIS) - Complete Database Schema
-- Database Name: staffspire
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.4+ / phpMyAdmin 5.2.1
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `staffspire` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `staffspire`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Table structure for table `roles`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `role_name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table structure for table `departments`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `department_name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table structure for table `leave_types`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `leave_types`;
CREATE TABLE `leave_types` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `annual_allocation` INT(11) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table structure for table `office_settings`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `office_settings`;
CREATE TABLE `office_settings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `office_name` VARCHAR(100) NOT NULL,
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `attendance_radius` FLOAT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table structure for table `employees`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `employee_code` VARCHAR(20) DEFAULT NULL,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `mobile` VARCHAR(15) DEFAULT NULL,
  `gender` ENUM('Male', 'Female', 'Other') DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT NULL,
  `salary` DECIMAL(10,2) DEFAULT NULL,
  `joining_date` DATE DEFAULT NULL,
  `employment_type` ENUM('Full Time', 'Part Time', 'Contract') DEFAULT NULL,
  `status` ENUM('Active', 'Inactive', 'Resigned') DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `employee_id` VARCHAR(20) DEFAULT NULL,
  `password` VARCHAR(255) DEFAULT NULL,
  `personal_email` VARCHAR(100) DEFAULT NULL,
  `location` VARCHAR(100) DEFAULT 'Mumbai, India',
  `date_of_birth` DATE DEFAULT NULL,
  `probation_period` VARCHAR(50) DEFAULT 'Ongoing',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table structure for table `users`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT(11) NOT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reset_otp` VARCHAR(10) DEFAULT NULL,
  `otp_expiry` DATETIME DEFAULT NULL,
  `login_id` VARCHAR(20) DEFAULT NULL,
  `must_change_password` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `login_id` (`login_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `fk_users_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table structure for table `attendance`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `employee_id` VARCHAR(20) NOT NULL,
  `attendance_date` DATE NOT NULL,
  `check_in` TIME DEFAULT NULL,
  `check_out` TIME DEFAULT NULL,
  `working_hours` TIME DEFAULT NULL,
  `status` ENUM('Present', 'Absent', 'Late', 'Half Day') DEFAULT 'Absent',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `latitude` DECIMAL(10,8) DEFAULT NULL,
  `longitude` DECIMAL(11,8) DEFAULT NULL,
  `accuracy` FLOAT DEFAULT NULL,
  `distance_from_office` FLOAT DEFAULT NULL,
  `location_status` ENUM('Inside Office', 'Outside Office') DEFAULT NULL,
  `location_captured_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`, `attendance_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table structure for table `deadline_notifications_log`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `deadline_notifications_log`;
CREATE TABLE `deadline_notifications_log` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`, `sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table structure for table `leave_requests`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `employee_id` VARCHAR(20) NOT NULL,
  `leave_type_id` INT(11) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` INT(11) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  `rejection_remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `leave_requests_ibfk_1` (`employee_id`),
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table structure for table `notifications`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table structure for table `projects`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `project_code` VARCHAR(50) DEFAULT NULL,
  `project_name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `department_id` VARCHAR(50) DEFAULT NULL,
  `manager_id` VARCHAR(50) DEFAULT NULL,
  `priority` VARCHAR(50) DEFAULT 'Medium',
  `status` VARCHAR(50) DEFAULT 'Active',
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `project_color` VARCHAR(20) DEFAULT '#4f8cff',
  `project_icon` VARCHAR(50) DEFAULT 'FaFolder',
  `completion_percentage` INT(11) DEFAULT 0,
  `created_by` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `repository_provider` VARCHAR(50) DEFAULT 'GitHub',
  `repository_url` VARCHAR(255) DEFAULT NULL,
  `default_branch` VARCHAR(100) DEFAULT 'main',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table structure for table `project_members`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `project_members`;
CREATE TABLE `project_members` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `project_id` INT(11) NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `fk_project_members_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Table structure for table `project_milestones`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `project_milestones`;
CREATE TABLE `project_milestones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `project_id` INT(11) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `due_date` DATE DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `completion_date` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `fk_project_milestones_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. Table structure for table `resignation_requests`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `resignation_requests`;
CREATE TABLE `resignation_requests` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `employee_id` VARCHAR(50) NOT NULL,
  `reason` VARCHAR(100) NOT NULL,
  `notice_period_days` INT(11) NOT NULL,
  `last_working_day` DATE NOT NULL,
  `status` ENUM('Draft', 'Submitted', 'Approved', 'Rejected', 'Completed', 'Withdrawn', 'Cancellation Requested', 'Cancelled') DEFAULT 'Submitted',
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` INT(11) DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `review_comments` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. Table structure for table `tasks`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `task_id` VARCHAR(20) DEFAULT NULL,
  `employee_id` VARCHAR(50) DEFAULT NULL,
  `task_title` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `deadline` DATE DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `assigned_by` VARCHAR(150) DEFAULT NULL,
  `assigned_by_user_id` INT(11) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `priority` VARCHAR(20) DEFAULT 'Medium',
  `remarks` TEXT DEFAULT NULL,
  `completion_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `project_id` INT(11) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_id` (`task_id`),
  KEY `fk_tasks_project` (`project_id`),
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. Table structure for table `task_submissions`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `task_submissions`;
CREATE TABLE `task_submissions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `task_id` INT(11) NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `summary` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `evidence_type` VARCHAR(50) DEFAULT NULL,
  `repository_url` VARCHAR(255) DEFAULT NULL,
  `commit_hash` VARCHAR(100) DEFAULT NULL,
  `pull_request_url` VARCHAR(255) DEFAULT NULL,
  `branch_name` VARCHAR(100) DEFAULT NULL,
  `demo_url` VARCHAR(255) DEFAULT NULL,
  `file_paths` LONGTEXT DEFAULT NULL,
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `review_status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  `reviewed_by` VARCHAR(50) DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `review_comments` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `fk_task_submissions_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- Default Seed Data
-- ==============================================================================

-- Roles
INSERT INTO `roles` (`id`, `role_name`) VALUES
(1, 'Admin'),
(2, 'Manager'),
(3, 'Employee')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- Default Leave Types
INSERT INTO `leave_types` (`id`, `name`, `annual_allocation`) VALUES
(1, 'Casual Leave', 12),
(2, 'Sick Leave', 10),
(3, 'Paid Leave', 15),
(4, 'Maternity Leave', 90),
(5, 'Paternity Leave', 15),
(6, 'Unpaid Leave', 0)
ON DUPLICATE KEY UPDATE `annual_allocation` = VALUES(`annual_allocation`);

-- Default Office Settings
INSERT INTO `office_settings` (`id`, `office_name`, `latitude`, `longitude`, `attendance_radius`) VALUES
(1, 'Main Headquarters', 19.07600000, 72.87770000, 200)
ON DUPLICATE KEY UPDATE `office_name` = VALUES(`office_name`);

-- Sample Departments
INSERT INTO `departments` (`id`, `department_name`) VALUES
(1, 'Engineering'),
(2, 'Human Resources'),
(3, 'Product & Design'),
(4, 'Sales & Marketing')
ON DUPLICATE KEY UPDATE `department_name` = VALUES(`department_name`);

SET FOREIGN_KEY_CHECKS = 1;
