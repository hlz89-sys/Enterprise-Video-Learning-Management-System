CREATE DATABASE IF NOT EXISTS enterprise_lms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE enterprise_lms;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  video_url VARCHAR(500) NOT NULL,
  type ENUM('local', 'external') NOT NULL,
  deadline DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  progress DECIMAL(5,2) NOT NULL DEFAULT 0,
  watch_time INT NOT NULL DEFAULT 0,
  exam_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  status ENUM('未开始', '学习中', '已完成') NOT NULL DEFAULT '未开始',
  is_overdue TINYINT(1) NOT NULL DEFAULT 0,
  admin_remark VARCHAR(500) NULL,
  last_position DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_heartbeat_at DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_course (user_id, course_id),
  KEY idx_status (status),
  KEY idx_is_overdue (is_overdue),
  CONSTRAINT fk_lr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lr_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  question TEXT NOT NULL,
  options JSON NOT NULL,
  correct_answer JSON NOT NULL,
  type ENUM('single', 'multi') NOT NULL DEFAULT 'single',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exam_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  submitted_at DATETIME NOT NULL,
  KEY idx_user_course_time (user_id, course_id, submitted_at),
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
