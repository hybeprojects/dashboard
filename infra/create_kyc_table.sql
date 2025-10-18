-- Run this on your MySQL database to create the kyc_submissions table

CREATE TABLE IF NOT EXISTS kyc_submissions (
  id VARCHAR(36) PRIMARY KEY,
  submission_id VARCHAR(36) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  ssn_last4 VARCHAR(4),
  address TEXT,
  open_savings TINYINT(1) DEFAULT 0,
  id_front_path VARCHAR(1024),
  id_back_path VARCHAR(1024),
  proof_path VARCHAR(1024),
  status VARCHAR(32) DEFAULT 'pending',
  review_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL
);
