require("dotenv").config({ path: __dirname + "/../.env" });
const db = require("../config/db");

const migrateResignations = async () => {
    try {
        console.log("Starting resignation module migrations...");

        // 1. Create resignation_requests table
        const createResignationsTable = `
            CREATE TABLE IF NOT EXISTS resignation_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL,
                reason VARCHAR(100) NOT NULL,
                notice_period_days INT NOT NULL,
                last_working_day DATE NOT NULL,
                status ENUM('Draft', 'Submitted', 'Approved', 'Rejected', 'Completed', 'Withdrawn', 'Cancellation Requested', 'Cancelled') DEFAULT 'Submitted',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_by INT DEFAULT NULL,
                reviewed_at TIMESTAMP NULL,
                review_comments TEXT,
                FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
            )
        `;

        await db.promise().query(createResignationsTable);
        console.log("resignation_requests table created or already exists.");

        // 2. Alter employees table to add 'status' column if it doesn't exist
        try {
            await db.promise().query("ALTER TABLE employees ADD COLUMN status VARCHAR(50) DEFAULT 'Active'");
            console.log("Added 'status' column to employees table.");
        } catch (err) {
            // Error code 1060 means duplicate column name
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'status' column already exists in employees table.");
            } else {
                throw err;
            }
        }

        console.log("Resignation module migrations completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrateResignations();
