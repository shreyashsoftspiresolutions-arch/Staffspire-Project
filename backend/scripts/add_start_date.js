require("dotenv").config({ path: __dirname + "/../.env" });
const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "staffspire",
    waitForConnections: true,
    connectionLimit: 5
});

const run = async () => {
    try {
        console.log("Checking and updating start_date in tasks table...");
        try {
            await db.promise().query("ALTER TABLE tasks ADD COLUMN start_date DATE NULL");
            console.log("Successfully added start_date column to tasks table.");
        } catch (err) {
            if (err.code === "ER_DUP_FIELDNAME") {
                console.log("start_date column already exists in tasks table.");
            } else {
                console.error("Error altering table:", err.message);
            }
        }

        // Update existing rows where start_date IS NULL to have today's date or created_at date
        const today = new Date().toISOString().split("T")[0];
        const [res] = await db.promise().query(
            `UPDATE tasks SET start_date = COALESCE(DATE(created_at), ?) WHERE start_date IS NULL OR start_date = '0000-00-00'`,
            [today]
        );
        console.log(`Updated ${res.affectedRows} existing tasks with default start_date.`);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        db.end();
    }
};

run();
