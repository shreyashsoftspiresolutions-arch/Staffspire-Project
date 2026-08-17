import { Link } from "react-router-dom";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import "../../styles/features.css";

function Features() {
    useScrollReveal();

    return (
        <div className="ss-public-body">
            <Navbar />
            <main className="ft-main">

                {/* ── Hero Header ─────────────────────────────────── */}
                <header className="ft-hero reveal-fade-in">
                    <span className="ft-hero-badge">Powerful HR Ecosystem</span>
                    <h1 className="ft-hero-title">
                        Everything You Need to<br />Manage Your Workforce
                    </h1>
                    <p className="ft-hero-subtitle">
                        Consolidate your entire HR workflow into a single, high-performance platform designed
                        for the modern enterprise.
                    </p>
                </header>

                {/* ── Bento Grid ──────────────────────────────────── */}
                <section className="ft-bento">

                    {/* Employee Management — wide card */}
                    <a href="#employees" className="ft-bento-card ft-bento-wide reveal-fade-in">
                        <div className="ft-bento-card-top">
                            <div className="ft-bento-icon-box">
                                <span className="material-symbols-outlined">groups</span>
                            </div>
                            <h3 className="ft-bento-card-title">Employee Management</h3>
                            <p className="ft-bento-card-desc">
                                A centralized hub for every member of your team. Manage detailed profiles,
                                organizational hierarchies, and talent records with ease.
                            </p>
                        </div>
                        {/* Mockup visual */}
                        <div className="ft-bento-mockup-rows">
                            <div className="ft-bento-mock-row">
                                <div className="ft-mock-avatar"></div>
                                <div className="ft-mock-line ft-mock-line-long"></div>
                            </div>
                            <div className="ft-bento-mock-row">
                                <div className="ft-mock-avatar ft-mock-avatar-alt"></div>
                                <div className="ft-mock-line ft-mock-line-med"></div>
                            </div>
                        </div>
                        <span className="ft-learn-more">
                            Learn More
                            <span className="material-symbols-outlined ft-learn-arrow">arrow_forward</span>
                        </span>
                    </a>

                    {/* Attendance */}
                    <a href="#attendance" className="ft-bento-card reveal-fade-in" style={{ transitionDelay: "100ms" }}>
                        <div className="ft-bento-icon-box">
                            <span className="material-symbols-outlined">schedule</span>
                        </div>
                        <h3 className="ft-bento-card-title">Attendance</h3>
                        <p className="ft-bento-card-desc">
                            Real-time tracking with geofencing and biometric integration.
                        </p>
                        <span className="ft-learn-more">
                            Learn More
                            <span className="material-symbols-outlined ft-learn-arrow">arrow_forward</span>
                        </span>
                    </a>

                    {/* Leave */}
                    <a href="#leave" className="ft-bento-card reveal-fade-in" style={{ transitionDelay: "200ms" }}>
                        <div className="ft-bento-icon-box">
                            <span className="material-symbols-outlined">event_available</span>
                        </div>
                        <h3 className="ft-bento-card-title">Leave</h3>
                        <p className="ft-bento-card-desc">
                            Streamline time-off requests with automated approval flows.
                        </p>
                        <span className="ft-learn-more">
                            Learn More
                            <span className="material-symbols-outlined ft-learn-arrow">arrow_forward</span>
                        </span>
                    </a>

                    {/* Tasks */}
                    <a href="#tasks" className="ft-bento-card reveal-fade-in" style={{ transitionDelay: "300ms" }}>
                        <div className="ft-bento-icon-box">
                            <span className="material-symbols-outlined">assignment</span>
                        </div>
                        <h3 className="ft-bento-card-title">Tasks</h3>
                        <p className="ft-bento-card-desc">
                            Kanban-powered workflows to keep projects moving forward.
                        </p>
                        <span className="ft-learn-more">
                            Learn More
                            <span className="material-symbols-outlined ft-learn-arrow">arrow_forward</span>
                        </span>
                    </a>

                    {/* Advanced Analytics — wide card */}
                    <a href="#reports" className="ft-bento-card ft-bento-wide reveal-fade-in" style={{ transitionDelay: "100ms" }}>
                        <div className="ft-bento-card-top">
                            <div className="ft-bento-icon-box">
                                <span className="material-symbols-outlined">insights</span>
                            </div>
                            <h3 className="ft-bento-card-title">Advanced Analytics</h3>
                            <p className="ft-bento-card-desc">
                                Generate data-driven insights with customizable reporting engines.
                                Monitor workforce efficiency and turnover in real-time.
                            </p>
                        </div>
                        {/* Chart visual */}
                        <div className="ft-bento-chart">
                            <div className="ft-bento-bar" style={{ height: "40%" }}></div>
                            <div className="ft-bento-bar ft-bar-full" style={{ height: "70%" }}></div>
                            <div className="ft-bento-bar" style={{ height: "50%", opacity: 0.7 }}></div>
                            <div className="ft-bento-bar" style={{ height: "90%", opacity: 0.85 }}></div>
                        </div>
                        <span className="ft-learn-more">
                            Learn More
                            <span className="material-symbols-outlined ft-learn-arrow">arrow_forward</span>
                        </span>
                    </a>

                    {/* Role Access */}
                    <a href="#" className="ft-bento-card reveal-fade-in" style={{ transitionDelay: "200ms" }}>
                        <div className="ft-bento-icon-box">
                            <span className="material-symbols-outlined">security</span>
                        </div>
                        <h3 className="ft-bento-card-title">Role Access</h3>
                        <p className="ft-bento-card-desc">
                            Enterprise-grade security with granular permission control.
                        </p>
                        <span className="ft-learn-more">
                            Learn More
                            <span className="material-symbols-outlined ft-learn-arrow">arrow_forward</span>
                        </span>
                    </a>

                </section>

                {/* ── Deep Dive: Employee Management ──────────────── */}
                <section className="ft-deep-section" id="employees">
                    <div className="ft-deep-row reveal-fade-in">
                        {/* Left: Text */}
                        <div className="ft-deep-text">
                            <h2 className="ft-deep-title">Employee Management</h2>
                            <p className="ft-deep-desc">
                                Maintain a robust database of your workforce. From onboarding to offboarding,
                                every detail is captured in a beautiful, searchable interface.
                            </p>
                            <ul className="ft-checklist">
                                <li>
                                    <span className="material-symbols-outlined ft-check-icon">check_circle</span>
                                    Dynamic Profile Builder
                                </li>
                                <li>
                                    <span className="material-symbols-outlined ft-check-icon">check_circle</span>
                                    Instant Global Search
                                </li>
                                <li>
                                    <span className="material-symbols-outlined ft-check-icon">check_circle</span>
                                    CRUD Operations for Admins
                                </li>
                            </ul>
                        </div>

                        {/* Right: Table mockup */}
                        <div className="ft-deep-visual">
                            <div className="ft-table-card">
                                {/* Toolbar */}
                                <div className="ft-table-toolbar">
                                    <div className="ft-search-box">
                                        <span className="material-symbols-outlined ft-search-icon">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            aria-label="Search employees"
                                            className="ft-search-input"
                                            readOnly
                                        />
                                    </div>
                                    <button type="button" className="ft-add-btn">
                                        <span className="material-symbols-outlined">add</span>
                                        Add Employee
                                    </button>
                                </div>
                                {/* Table */}
                                <table className="ft-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Department</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th className="ft-th-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div className="ft-avatar-cell">
                                                    <div className="ft-avatar ft-avatar-blue">JD</div>
                                                    Jane Doe
                                                </div>
                                            </td>
                                            <td>Engineering</td>
                                            <td>Senior Architect</td>
                                            <td><span className="ft-badge ft-badge-active">Active</span></td>
                                            <td className="ft-td-right">
                                                <button type="button" className="ft-action-btn">
                                                    <span className="material-symbols-outlined">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="ft-avatar-cell">
                                                    <div className="ft-avatar ft-avatar-indigo">MS</div>
                                                    Mark Smith
                                                </div>
                                            </td>
                                            <td>Marketing</td>
                                            <td>Creative Director</td>
                                            <td><span className="ft-badge ft-badge-active">Active</span></td>
                                            <td className="ft-td-right">
                                                <button type="button" className="ft-action-btn">
                                                    <span className="material-symbols-outlined">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Deep Dive: Attendance ───────────────────────── */}
                <section className="ft-deep-section ft-deep-alt" id="attendance">
                    <div className="ft-deep-row ft-deep-row-reverse reveal-fade-in">
                        {/* Right: Text (reversed) */}
                        <div className="ft-deep-text">
                            <h2 className="ft-deep-title">Attendance &amp; Tracking</h2>
                            <p className="ft-deep-desc">
                                Eliminate manual logs. Our smart tracking system detects late arrivals,
                                calculates overtime, and provides a clear visual timeline of workforce presence.
                            </p>
                            {/* Live Status Card */}
                            <div className="ft-live-card">
                                <div className="ft-live-status-row">
                                    <span className="ft-live-label">Live Status</span>
                                    <span className="ft-live-percent">
                                        <span className="ft-live-dot"></span>
                                        94% Present
                                    </span>
                                </div>
                                <button type="button" className="ft-checkin-btn">Check In / Out</button>
                            </div>
                        </div>

                        {/* Left: Weekly calendar mockup */}
                        <div className="ft-deep-visual">
                            <div className="ft-attendance-card">
                                <div className="ft-att-header">
                                    <h4 className="ft-att-title">Weekly Attendance Visualizer</h4>
                                    <div className="ft-att-nav">
                                        <button type="button" className="ft-nav-btn">
                                            <span className="material-symbols-outlined">chevron_left</span>
                                        </button>
                                        <button type="button" className="ft-nav-btn">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="ft-week-grid">
                                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
                                        <div key={d} className="ft-day-label">{d}</div>
                                    ))}
                                    <div className="ft-day-cell ft-day-ontime">
                                        <span className="ft-day-time">09:00</span>
                                        <span className="ft-day-status">On Time</span>
                                    </div>
                                    <div className="ft-day-cell ft-day-early">
                                        <span className="ft-day-time">08:45</span>
                                        <span className="ft-day-status">Early</span>
                                    </div>
                                    <div className="ft-day-cell ft-day-late">
                                        <span className="ft-day-time">09:45</span>
                                        <span className="ft-day-status">Late</span>
                                    </div>
                                    <div className="ft-day-cell ft-day-ontime">
                                        <span className="ft-day-time">09:00</span>
                                        <span className="ft-day-status">On Time</span>
                                    </div>
                                    <div className="ft-day-cell ft-day-ontime">
                                        <span className="ft-day-time">09:00</span>
                                        <span className="ft-day-status">On Time</span>
                                    </div>
                                    <div className="ft-day-cell ft-day-weekend">
                                        <span className="ft-day-time">--:--</span>
                                        <span className="ft-day-status">Weekend</span>
                                    </div>
                                    <div className="ft-day-cell ft-day-weekend">
                                        <span className="ft-day-time">--:--</span>
                                        <span className="ft-day-status">Weekend</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Deep Dive: Leave + Task ─────────────────────── */}
                <section className="ft-deep-section">
                    <div className="ft-leave-task-grid">

                        {/* Leave Management */}
                        <div className="reveal-fade-in" id="leave">
                            <h2 className="ft-deep-title">Leave Management</h2>
                            <div className="ft-leave-card">
                                <div className="ft-leave-header">
                                    <div>
                                        <span className="ft-leave-balance-label">Current Balance</span>
                                        <span className="ft-leave-balance">12 Days</span>
                                    </div>
                                    <button type="button" className="ft-apply-btn">Apply Leave</button>
                                </div>
                                <div className="ft-leave-timeline">
                                    <div className="ft-leave-item">
                                        <div className="ft-leave-dot ft-dot-active"></div>
                                        <div className="ft-leave-item-content">
                                            <div className="ft-leave-item-header">
                                                <div>
                                                    <h4 className="ft-leave-item-title">Vacation – Annual Leave</h4>
                                                    <p className="ft-leave-item-date">Oct 24 – Oct 28 (5 Days)</p>
                                                </div>
                                                <span className="ft-status-badge ft-status-approved">Approved</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ft-leave-item">
                                        <div className="ft-leave-dot"></div>
                                        <div className="ft-leave-item-content">
                                            <div className="ft-leave-item-header">
                                                <div>
                                                    <h4 className="ft-leave-item-title">Medical Leave</h4>
                                                    <p className="ft-leave-item-date">Nov 02 (1 Day)</p>
                                                </div>
                                                <span className="ft-status-badge ft-status-pending">Pending</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Task Management */}
                        <div className="reveal-fade-in" id="tasks" style={{ transitionDelay: "150ms" }}>
                            <h2 className="ft-deep-title">Task Management</h2>
                            <div className="ft-task-card">
                                <div className="ft-task-header">
                                    <h4 className="ft-task-project">Project Horizon</h4>
                                    <div className="ft-task-avatars">
                                        <div className="ft-task-avatar" style={{ background: "#3b82f6" }}></div>
                                        <div className="ft-task-avatar" style={{ background: "#6366f1" }}></div>
                                        <div className="ft-task-avatar ft-task-avatar-count">+3</div>
                                    </div>
                                </div>
                                <div className="ft-tasks-list">
                                    <div className="ft-task-item">
                                        <div className="ft-task-item-top">
                                            <span className="ft-task-tag ft-task-tag-progress">In Progress</span>
                                            <span className="ft-task-date">Nov 12</span>
                                        </div>
                                        <p className="ft-task-name">Develop Q4 HR Compliance Report</p>
                                        <div className="ft-task-progress-bar">
                                            <div className="ft-task-progress-fill" style={{ width: "65%" }}></div>
                                        </div>
                                    </div>
                                    <div className="ft-task-item">
                                        <div className="ft-task-item-top">
                                            <span className="ft-task-tag ft-task-tag-high">High Priority</span>
                                            <span className="ft-task-date">Nov 15</span>
                                        </div>
                                        <p className="ft-task-name">Onboard 12 New Engineering Hires</p>
                                        <div className="ft-task-progress-bar">
                                            <div className="ft-task-progress-fill" style={{ width: "15%" }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ── Deep Dive: Comprehensive Insights ──────────── */}
                <section className="ft-deep-section" id="reports">
                    <div className="ft-insights-card reveal-zoom-in">
                        {/* Glow blob */}
                        <div className="ft-insights-blob"></div>

                        <div className="ft-insights-row">
                            {/* Left text */}
                            <div className="ft-insights-text">
                                <h2 className="ft-insights-title">Comprehensive Insights</h2>
                                <p className="ft-insights-desc">
                                    Access granular reports across every department. Export your data in
                                    multiple formats with a single click and stay ahead of the curve.
                                </p>
                                <div className="ft-insights-btns">
                                    <button type="button" className="ft-export-btn">
                                        <span className="material-symbols-outlined">picture_as_pdf</span>
                                        Export PDF
                                    </button>
                                    <button type="button" className="ft-export-btn">
                                        <span className="material-symbols-outlined">table_chart</span>
                                        Excel / CSV
                                    </button>
                                </div>
                            </div>

                            {/* Right chart */}
                            <div className="ft-insights-chart-wrap">
                                <div className="ft-insights-chart">
                                    <div className="ft-ins-bar" style={{ height: "40%" }}></div>
                                    <div className="ft-ins-bar" style={{ height: "80%" }}></div>
                                    <div className="ft-ins-bar" style={{ height: "60%", opacity: 0.7 }}></div>
                                    <div className="ft-ins-bar" style={{ height: "95%", opacity: 0.85 }}></div>
                                    <div className="ft-ins-bar" style={{ height: "30%", opacity: 0.5 }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}

export default Features;
