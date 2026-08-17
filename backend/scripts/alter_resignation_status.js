require("dotenv").config({ path: __dirname + "/../.env" });
const db = require("../config/db");

const alterResignationStatus = async () => {
    try {
        console.log("Altering resignation_requests status ENUM...");
        await db.promise().query(`
            ALTER TABLE resignation_requests 
            MODIFY COLUMN status ENUM('Draft', 'Submitted', 'Approved', 'Rejected', 'Completed', 'Withdrawn', 'Cancellation Requested', 'Cancelled') DEFAULT 'Submitted'
        `);
        console.log("Successfully updated ENUM.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

alterResignationStatus();
