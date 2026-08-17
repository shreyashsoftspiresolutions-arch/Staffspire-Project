require('dotenv').config();
const db = require('../config/db');

async function migrate() {
    try {
        console.log("Starting task_submissions migration...");

        const createSubmissionsTable = `
            CREATE TABLE IF NOT EXISTS task_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                employee_id VARCHAR(50) NOT NULL,
                summary VARCHAR(255),
                notes TEXT,
                evidence_type VARCHAR(50),
                repository_url VARCHAR(255),
                commit_hash VARCHAR(100),
                pull_request_url VARCHAR(255),
                branch_name VARCHAR(100),
                demo_url VARCHAR(255),
                file_paths JSON,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                review_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                reviewed_by VARCHAR(50),
                reviewed_at TIMESTAMP NULL,
                review_comments TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `;

        await db.promise().query(createSubmissionsTable);
        console.log("task_submissions table created successfully.");

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
