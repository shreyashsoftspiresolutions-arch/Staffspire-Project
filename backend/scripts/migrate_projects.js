require("dotenv").config({ path: __dirname + "/../.env" });
const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const runMigrations = async () => {
    try {
        console.log("Starting database migrations...");

        const createProjectsTable = `
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_code VARCHAR(50),
                project_name VARCHAR(255) NOT NULL,
                description TEXT,
                department_id VARCHAR(50),
                manager_id VARCHAR(50),
                priority VARCHAR(50) DEFAULT 'Medium',
                status VARCHAR(50) DEFAULT 'Active',
                start_date DATE,
                end_date DATE,
                project_color VARCHAR(20) DEFAULT '#4f8cff',
                project_icon VARCHAR(50) DEFAULT 'FaFolder',
                completion_percentage INT DEFAULT 0,
                created_by VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        const createProjectMembersTable = `
            CREATE TABLE IF NOT EXISTS project_members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                employee_id VARCHAR(50) NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `;

        const createProjectMilestonesTable = `
            CREATE TABLE IF NOT EXISTS project_milestones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATE,
                status VARCHAR(50) DEFAULT 'Pending',
                completion_date DATE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `;

        await db.promise().query(createProjectsTable);
        console.log("Projects table created or already exists.");

        await db.promise().query(createProjectMembersTable);
        console.log("Project_members table created or already exists.");

        await db.promise().query(createProjectMilestonesTable);
        console.log("Project_milestones table created or already exists.");


        // Alter projects table for GitHub integration
        try {
            await db.promise().query("ALTER TABLE projects ADD COLUMN repository_provider VARCHAR(50) DEFAULT 'GitHub'");
            await db.promise().query("ALTER TABLE projects ADD COLUMN repository_url VARCHAR(255)");
            await db.promise().query("ALTER TABLE projects ADD COLUMN default_branch VARCHAR(100) DEFAULT 'main'");
            console.log("Added repository fields to projects table.");
        } catch (err) {
            if (err.code === "ER_DUP_FIELDNAME") {
                console.log("Repository fields already exist in projects table.");
            } else {
                console.warn("Could not alter projects table:", err.message);
            }
        }

        // Alter tasks table
        try {
            await db.promise().query("ALTER TABLE tasks ADD COLUMN project_id INT NULL");
            console.log("Added project_id column to tasks table.");
            await db.promise().query("ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL");
            console.log("Added foreign key constraint for project_id.");
        } catch (err) {
            if (err.code === "ER_DUP_FIELDNAME") {
                console.log("Column project_id already exists in tasks table.");
            } else {
                console.warn("Could not alter tasks table (maybe column already exists, or foreign key issue):", err.message);
            }
        }

        console.log("Migrations completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        db.end();
    }
};

runMigrations();
