# Staffspire — Modern Employee Management System (HRIS)

A full-stack, enterprise-grade Employee Management System (HRIS) designed for modern workplaces. Built with **React 19**, **Vite**, **Tailwind CSS v4**, **Node.js**, **Express 5**, and **MySQL**.

---

## 🌟 Key Features & Current Capabilities

### 1. 🔐 Multi-Role Authentication & Access Control
- **Role-Based Access**: Specialized interfaces and authorization for **Admin**, **Manager**, and **Employee**.
- **Flexible Login**: Support for login via registered email or auto-generated Employee ID.
- **Admin Setup**: Dedicated admin bootstrap onboarding flow (`/register-admin`).
- **Password Security**: Bcryptjs hashing, secure credential reveal with admin authorization, and change password flow.
- **Password Recovery**: Secure OTP-based password reset sent via email (with fallback mock logging).

### 2. 👥 Complete Employee Lifecycle Management
- **Multi-Step Onboarding**: Add employees with personal details, contact info, job classification, salary structure, bank info, and document uploads.
- **Auto-Generated Employee IDs**: Standardized employee code generation upon onboarding.
- **Employee Directory**: Searchable, filterable directory with department filters, status toggles (Active, On Leave, Resigned), and pagination.
- **Detailed Profiles**: Comprehensive employee profile view with editable sections, document preview/download, and status history.
- **Self-Service Employee Portal**: Employees can view and manage their personal information.

### 3. 📍 Geofenced Attendance Tracking & Automation
- **Geofence Validation**: Real-time GPS location validation against configured office coordinates and radius.
- **Punch In / Punch Out**: One-click check-in and check-out with automatic duration calculation.
- **Smart Status Detection**: Automatically calculates attendance status (`Present`, `Late`, `Half Day`, `Absent`, `Overtime`).
- **Attendance History & Analytics**: Visual attendance calendars, punch timestamps, working hours summaries, and monthly trends.
- **Automated Absence Marking**: Daily cron job (`08:45 AM`) automatically marks absent records for unpunched employees.

### 4. 🌴 Leave Management & Workflow
- **Multi-Type Leave Tracking**: Supports Casual, Sick, Paid, Maternity/Paternity, and Unpaid leaves.
- **Leave Request Flow**: Employees apply for leaves with date range picking, total day calculation, and reason.
- **Admin Review Pipeline**: Centralized portal for admins to approve or reject leave applications with notes.
- **Leave Balance Engine**: Real-time tracking of remaining quota and historical requests.

### 5. 🚀 Project & Milestone Management
- **Project Dashboard**: Executive metrics showing active projects, completion rates, budget utilization, and health indicators.
- **Project CRUD & Tracking**: Manage project code, client details, budgets, priorities, dates, and status (`Planning`, `In Progress`, `On Hold`, `Completed`).
- **Team Allocation**: Assign project leads and cross-functional team members with role indicators.
- **Kanban / Task Association**: Link tasks and milestones directly to projects.

### 6. 📋 Task Management & Submissions
- **Task Delegation**: Create, assign, and prioritize tasks with deadlines, descriptions, and file attachments.
- **Task Statuses**: Lifecycle tracking across `To Do`, `In Progress`, `In Review`, `Completed`, and `Overdue`.
- **Submission & Review System**: Employees submit work with attachments and notes; admins/managers can review and approve or request revisions.
- **Employee "My Tasks"**: Focused task board for employees to manage daily assignments.

### 7. 🚪 Resignation & Offboarding Automation
- **Employee Resignation Filing**: Submit resignation request with reasons, feedback, and proposed last working day.
- **Admin Approval & Exit Date Setting**: Admins review, approve, or decline requests and set finalized last working days.
- **Automated Offboarding Job**: Daily midnight cron (`00:00 AM`) automatically updates employee status to `Resigned` once their last working day has passed and issues an exit notification.

### 8. 🏢 Department Management
- **Department Hierarchy**: Manage organizational departments, department heads, and functional roles.
- **Real-Time Headcount**: Instant employee count aggregation per department.
- **Department Detail Pages**: View all department members, assigned leads, and department-specific statistics.

### 9. 🔔 Real-Time In-App Notification Center
- **Instant Alerts**: Automated notifications for leave approvals/rejections, task assignments, project updates, and resignation status changes.
- **Notification Drawer**: Unread counters, one-click "mark as read", and direct links to relevant modules.

### 10. 📊 Analytics, Reports & Document Export Engine
- **Reports Dashboard**: Interactive charts powered by **Chart.js** displaying workforce statistics, attendance patterns, and departmental metrics.
- **PDF Exporting**: High-fidelity formatted PDF reports generated using **PDFKit**.
- **Excel / Spreadsheet Exporting**: Structured data export (.xlsx) generated using **ExcelJS**.

### 11. 🌐 Public Marketing / Landing Pages
- Clean, responsive public showcase pages: **Home**, **Features**, **Solutions**, **About**, and **Contact**.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend UI** | React 19, Tailwind CSS v4, Vite 8 | Ultra-fast bundling, modern styling, responsive layouts |
| **State & Data** | SWR, Axios, React Router DOM v7 | Efficient caching, declarative client routing, REST client |
| **Visualizations** | Chart.js | Interactive workforce and attendance analytics |
| **Backend API** | Node.js, Express 5 | Modular MVC architecture, RESTful API endpoints |
| **Database** | MySQL (MySQL2 pool) | Relational database with parameterized queries and pooling |
| **Authentication**| JWT (JSON Web Tokens), Bcryptjs | Stateless session management, password hashing |
| **Scheduling** | node-cron | Scheduled cron jobs for auto-absenteeism and offboarding |
| **File Handling** | Multer | Local document and attachment storage (`/uploads`) |
| **Export Engines**| PDFKit, ExcelJS | Server-side PDF and Excel generation |
| **Mailing** | Nodemailer | Transactional OTP emails with mock logger fallback |

---

## 📁 Project Structure

```
Employee Management System/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MySQL2 connection pool setup
│   │   └── mailConfig.js         # Nodemailer transporter configuration
│   ├── controllers/              # Business logic controllers (14 modules)
│   │   ├── adminDashboardController.js
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── departmentController.js
│   │   ├── employeeController.js
│   │   ├── employeeDashboardController.js
│   │   ├── leaveController.js
│   │   ├── managerDashboardController.js
│   │   ├── notificationController.js
│   │   ├── officeSettingsController.js
│   │   ├── projectController.js
│   │   ├── reportController.js
│   │   ├── resignationController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT token verification
│   │   └── roleMiddleware.js     # Role-based authorization guard
│   ├── routes/                   # Express router definitions (13 route files)
│   │   ├── adminRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── authRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── employeeDashboardRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── leaveRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── officeSettingsRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── resignationRoutes.js
│   │   └── taskRoutes.js
│   ├── scripts/                  # DB migration & schema alter scripts
│   │   ├── add_start_date.js
│   │   ├── alter_resignation_status.js
│   │   ├── migrate_projects.js
│   │   ├── migrate_resignations.js
│   │   └── migrate_task_submissions.js
│   ├── uploads/                  # Uploaded files and attachments
│   ├── utils/                    # Helper functions (crypto, PDF, Excel, token)
│   │   ├── cryptoHelper.js
│   │   ├── csvGenerator.js
│   │   ├── emailHelper.js
│   │   ├── excelGenerator.js
│   │   ├── generateToken.js
│   │   └── pdfGenerator.js
│   ├── server.js                 # Backend entry point and cron scheduler
│   ├── package.json
│   ├── schema.sql                # Database schema definition
│   └── .env.example              # Environment variables template
├── frontend/
│   ├── public/                   # Static assets & icons
│   ├── src/
│   │   ├── auth/                 # Login, Register Admin, Password Reset flows
│   │   ├── components/           # Reusable UI widgets, Navbars, Modals
│   │   ├── pages/
│   │   │   ├── admin/            # Admin portal pages (Employees, Projects, Tasks, etc.)
│   │   │   ├── employee/         # Employee portal pages (Dashboard, Tasks, Attendance, etc.)
│   │   │   ├── manager/          # Manager overview & team management
│   │   │   ├── public/           # Public website (Home, About, Features, Contact)
│   │   │   ├── reports/          # Reports and data analytics dashboard
│   │   │   └── settings/         # Office location and geofence settings
│   │   ├── styles/               # Global CSS & Tailwind imports
│   │   ├── App.jsx               # Main React router configuration
│   │   └── main.jsx              # React DOM entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore                    # Global git ignore configuration
├── schema.sql                    # Root database schema script
├── StaffSpire Project Requirement.docx
└── README.md
```

---

## ⚡ API Route Directory

| Base URI | Controller / Feature | Access |
|---|---|---|
| `/api/auth` | Login, Admin Registration, OTP Password Reset | Public |
| `/api/admin` | Admin Dashboard stats, System health, Password Reveal | Admin |
| `/api/employees` | Employee CRUD, Document uploads, Profile queries | Admin / Manager |
| `/api/employee` | Employee self-dashboard stats, personal metrics | Authenticated Employee |
| `/api/attendance` | Check-in, Check-out, History, Geofence validation | Authenticated Users |
| `/api/leaves` | Apply, Review, Status updates, Leave balances | Authenticated Users |
| `/api/projects` | Project CRUD, Project Dashboard, Milestones, Team assignments | Admin / Manager / Employee |
| `/api/tasks` | Task CRUD, Submissions, Attachments, Status updates | Admin / Manager / Employee |
| `/api/departments` | Department CRUD, Department Heads, Member lists | Admin / Manager |
| `/api/resignations`| Submit resignation, Approve/Decline, Offboarding records | Authenticated Users |
| `/api/notifications`| Notification inbox, Mark as read, Unread count | Authenticated Users |
| `/api/reports` | Summary metrics, PDF & Excel export generators | Admin / Manager |
| `/api/office-settings`| Geofence coordinates, Radius, Office hours | Admin / Manager |

---

## ⏰ Automated Background Tasks (Cron Jobs)

The system includes automated server tasks running via `node-cron`:

1. **Auto-Mark Absents (`45 8 * * *`)**:
   - Runs every day at **8:45 AM**.
   - Identifies active employees who have not checked in for the day and creates an `Absent` record.
2. **Resignation Finalization (`0 0 * * *`)**:
   - Runs every night at **Midnight (00:00 AM)**.
   - Finds all approved resignations whose last working day is `<= today`, marks employee records as `Resigned`, closes the resignation request as `Completed`, and notifies the user.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MySQL**: v8.0 or higher
- **npm** or **yarn**

---

### Step 1: Database Setup
1. Open your MySQL client (phpMyAdmin, MySQL Workbench, or CLI).
2. Run / Import the complete schema script:
   ```bash
   mysql -u root -p staffspire < schema.sql
   ```
   *Or in phpMyAdmin:*
   - Create a database named `staffspire`
   - Click the **Import** tab and select [`schema.sql`](./schema.sql).
   - Click **Go** to generate all 16 tables, constraints, foreign keys, and seed data.

---

### Step 2: Backend Configuration & Start

1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   npm install
   ```
2. Create or verify your `.env` file in `backend/.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=staffspire
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```
   > The API server will start on `http://localhost:5000`.

---

### Step 3: Frontend Configuration & Start

1. Open a new terminal and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > The frontend application will be live at `http://localhost:5173`.

---

## 🔒 Security Practices
- **Password Security**: Passwords hashed using industry-standard `bcryptjs`.
- **JWT Protection**: Protected routes authenticated via `Authorization: Bearer <token>`.
- **Role Verification**: Middleware prevents unauthorized cross-role access (e.g. employee attempting admin operations).
- **SQL Injection Prevention**: Parameterized queries across all database interactions.
- **Geofence Guard**: Haversine distance formula used to enforce physical location rules during attendance punches.

---

## 📄 License
This project is licensed under the ISC / MIT License.

**Project By ~Shreyash Anawane**
