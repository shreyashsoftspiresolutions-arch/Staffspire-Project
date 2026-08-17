import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import {

    FaSignInAlt, FaClock, FaCalendarAlt, FaCheckCircle,
    FaEllipsisV, FaPlus, FaArrowRight, FaChartLine
} from "react-icons/fa";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

const API_BASE = "http://localhost:5000/api";

function EmployeeDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [loading, setLoading] = useState(true);
    const [dashData, setDashData] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);



    const { data: dashDataRes, isLoading: dashLoading } = useSWR(token ? `${API_BASE}/employee/dashboard` : null, fetcher);
    const { data: todayRes, isLoading: todayLoading } = useSWR(token ? `${API_BASE}/attendance/today` : null, fetcher);

    useEffect(() => {
        if (!token) return;
        setLoading(dashLoading || todayLoading || (!dashDataRes && !todayRes));
        if (todayRes) {
            setTodayStatus(todayRes);
        }
        if (dashDataRes && dashDataRes.success !== false) {
            setDashData(dashDataRes);
        }
    }, [dashDataRes, todayRes, dashLoading, todayLoading, token]);

    const formatDateTime = (date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    const handleCheckOut = async () => {
        if (!token) return;
        try {
            await axios.post(`${API_BASE}/attendance/check-out`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (err) {
            console.error("Check-out error:", err);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="emp-loading">Loading Dashboard...</div>
            </DashboardLayout>
        );
    }

    const employee = dashData?.employee || {};
    const todayAtt = dashData?.todayAttendance || {};
    const workingHours = dashData?.workingHours || {};
    const leaveBalance = dashData?.leaveBalance || {};
    const tasks = dashData?.tasks || [];
    const projects = dashData?.projects || [];
    const heatmap = dashData?.heatmap || [];
    const upcomingEvents = dashData?.upcomingEvents || [];

    // From the today status endpoint
    const attendanceRecord = todayStatus?.attendance || null;
    const isCheckedIn = !!(attendanceRecord?.check_in && !attendanceRecord?.check_out);
    const isCheckedOut = !!(attendanceRecord?.check_out);
    const todayStatusLabel = todayStatus?.todayStatusLabel || todayAtt.status || "Not Checked In";
    const checkInTime = attendanceRecord?.check_in || todayAtt.checkIn || null;

    // Priority badge class
    const badgeClass = (priority) => {
        if (priority === "High") return "emp-badge high";
        if (priority === "Medium") return "emp-badge medium";
        return "emp-badge low";
    };

    const todayDateStr = new Date().toISOString().split("T")[0];

    return (
        <DashboardLayout>
            <div className="emp-dashboard">
                {/* ---- Header ---- */}
                <div className="emp-header">
                    <div className="emp-header-left">
                        <h1>Welcome back, {employee.name?.split(" ")[0] || "Employee"}!</h1>
                        <p className="emp-date">{formatDateTime(currentTime)}</p>
                    </div>
                    <div>
                        {isCheckedIn && !isCheckedOut ? (
                            <button type="button" className="emp-checkout-btn" onClick={handleCheckOut}>
                                <FaClock size={14} />
                                Check Out
                            </button>
                        ) : isCheckedOut ? (
                            <button type="button" className="emp-checkout-btn checked-out" disabled>
                                <FaCheckCircle size={14} />
                                Checked Out
                            </button>
                        ) : (
                            <button type="button"
                                className="emp-checkout-btn"
                                onClick={() => navigate("/employee/attendance")}
                            >
                                <FaSignInAlt size={14} />
                                Check In
                            </button>
                        )}
                    </div>
                </div>

                {/* ---- Summary Cards ---- */}
                <div className="emp-summary-grid">
                    {/* Attendance Card */}
                    <div className="emp-card">
                        <div className="emp-card-top">
                            <div className="emp-card-icon blue">
                                <FaSignInAlt />
                            </div>
                            <span className="emp-card-badge">Today</span>
                        </div>
                        <div>
                        <p className="emp-card-label">Today's Attendance</p>
                        <p className="emp-card-value">
                            {todayStatusLabel}
                        </p>
                        {checkInTime && (
                            <div className="emp-card-sub">
                                <FaClock size={12} />
                                {checkInTime}
                            </div>
                        )}
                    </div>
                    </div>

                    {/* Working Hours Card */}
                    <div className="emp-card">
                        <div className="emp-card-glow"></div>
                        <div className="emp-card-top">
                            <div className="emp-card-icon primary">
                                <FaClock />
                            </div>
                        </div>
                        <div>
                            <p className="emp-card-label">Working Hours</p>
                            <p className="emp-card-value">
                                <span className="big">{workingHours.decimal || 0}</span>
                                <span className="unit">h</span>
                            </p>
                            <div className="emp-hours-bar-bg">
                                <div
                                    className="emp-hours-bar-fill"
                                    style={{ width: `${workingHours.percent || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Leave Balance Card */}
                    <div className="emp-card">
                        <div className="emp-card-top">
                            <div className="emp-card-icon secondary">
                                <FaCalendarAlt />
                            </div>
                            <button type="button"
                                className="emp-leave-apply-btn"
                                onClick={() => navigate("/employee/leaves")}
                            >
                                Apply <FaArrowRight size={11} />
                            </button>
                        </div>
                        <div>
                            <p className="emp-card-label">Leave Balance</p>
                            <p className="emp-card-value">
                                {leaveBalance.remaining ?? 20}{" "}
                                <span style={{ fontSize: "15px", fontWeight: 400, color: "#585f6c" }}>
                                    days remaining
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ---- Main Grid ---- */}
                <div className="emp-main-grid">
                    {/* Left: My Tasks & Projects */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {/* My Tasks */}
                        <div className="emp-tasks-card">
                            <div className="emp-tasks-header">
                                <h3 className="emp-tasks-title">
                                    <FaCheckCircle color="#004ac6" />
                                    My Tasks
                                </h3>
                                <button type="button"
                                    className="emp-submit-btn"
                                    onClick={() => navigate("/employee/tasks")}
                                >
                                    <FaPlus size={13} /> View All
                                </button>
                            </div>

                            {tasks.length > 0 ? (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="emp-task-table">
                                        <thead>
                                            <tr>
                                                <th>Task Name</th>
                                                <th>Priority</th>
                                                <th>Deadline</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => (
                                                <tr key={task.id}>
                                                    <td>
                                                        <div
                                                            className="emp-task-name"
                                                            onClick={() => navigate(`/employee/tasks/${task.id}`)}
                                                        >
                                                            {task.title}
                                                        </div>
                                                        {task.department && (
                                                            <div className="emp-task-dept">{task.department}</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={badgeClass(task.priority)}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="emp-task-deadline">{task.deadline}</span>
                                                    </td>
                                                    <td>
                                                        <button type="button"
                                                            className="emp-task-action-btn"
                                                            onClick={() => navigate(`/employee/tasks/${task.id}`)}
                                                            title="View task"
                                                        >
                                                            <FaEllipsisV size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="emp-tasks-empty">
                                    <FaCheckCircle size={32} color="#e1e2ed" style={{ marginBottom: 12 }} />
                                    <p>No active tasks assigned to you.</p>
                                </div>
                            )}
                        </div>

                        {/* Assigned Projects & Workload */}
                        <div className="emp-tasks-card emp-projects-card">
                            <div className="emp-tasks-header">
                                <h3 className="emp-tasks-title">
                                    <span style={{ fontSize: "18px" }}>📁</span>
                                    Assigned Projects & Workload
                                </h3>
                                <button type="button"
                                    className="emp-submit-btn"
                                    onClick={() => navigate("/employee/projects")}
                                >
                                    <FaPlus size={13} /> View All ({projects.length})
                                </button>
                            </div>

                            {projects.length > 0 ? (
                                <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                                    {projects.map((proj, idx) => {
                                        const prog = proj.completion_percentage || 0;
                                        const badgeColor = proj.status === 'Completed' ? '#16a34a' : proj.status === 'On Hold' ? '#64748b' : '#2563eb';
                                        const badgeBg = proj.status === 'Completed' ? '#dcfce7' : proj.status === 'On Hold' ? '#f1f5f9' : '#e0f2fe';
                                        const priorityColor = proj.priority === 'High' ? '#ef4444' : proj.priority === 'Medium' ? '#f59e0b' : '#3b82f6';
                                        
                                        return (
                                            <div key={idx} onClick={() => navigate(`/employee/projects/${proj.id}`)} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff", transition: "all 0.2s ease", display: "flex", flexDirection: "column", justify: "space-between", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }} className="emp-proj-card-item">
                                                <div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "8px" }}>
                                                        <div>
                                                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>{proj.project_name}</div>
                                                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{proj.project_code || `PRJ-00${idx+1}`}</div>
                                                        </div>
                                                        <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: badgeBg, color: badgeColor, whiteSpace: "nowrap" }}>
                                                            {proj.status || "In Progress"}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
                                                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: priorityColor }}></span>
                                                            <strong style={{ color: "#334155" }}>{proj.priority || "Medium"}</strong>
                                                        </span>
                                                        <span>•</span>
                                                        <span>Due: {proj.end_date ? new Date(proj.end_date).toLocaleDateString() : "Ongoing"}</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                                                        <span style={{ color: "#475569" }}>Completion</span>
                                                        <span style={{ color: prog === 100 ? "#16a34a" : "#004ac6" }}>{prog}%</span>
                                                    </div>
                                                    <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                                                        <div style={{ width: `${prog}%`, height: "100%", background: prog === 100 ? "#10b981" : "#004ac6", borderRadius: "4px", transition: "width 0.5s ease" }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="emp-tasks-empty">
                                    <span style={{ fontSize: "32px", marginBottom: "12px" }}>🚀</span>
                                    <p>No projects assigned to you or your department yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="emp-right-col">
                        {/* Upcoming Events */}
                        <div className="emp-upcoming-card">
                            <h3 className="emp-section-title">
                                <FaCalendarAlt color="#585f6c" />
                                Upcoming
                            </h3>

                            {upcomingEvents.length > 0 ? (
                                <div className="emp-timeline">
                                    {upcomingEvents.map((ev, idx) => (
                                        <div className="emp-timeline-item" key={idx}>
                                            <div className={`emp-timeline-dot ${idx === 0 ? "active" : "inactive"}`}>
                                                <div className="emp-timeline-dot-inner"></div>
                                            </div>
                                            <div className="emp-timeline-text">
                                                <strong>{ev.title}</strong>
                                                <span>{ev.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: "24px 0", textAlign: "center", color: "#737686", fontSize: "13px" }}>
                                    No upcoming events or pending leave requests.
                                </div>
                            )}
                        </div>

                        {/* Attendance Heatmap */}
                        <div className="emp-heatmap-card">
                            <h3 className="emp-section-title">
                                <FaChartLine color="#585f6c" />
                                Attendance History
                            </h3>
                            <p className="emp-heatmap-subtitle">Last 14 days activity</p>

                            <div className="emp-heatmap-grid">
                                {heatmap.map((cell, idx) => {
                                    const isToday = cell.date === todayDateStr;
                                    const cellClass = [
                                        "emp-heatmap-cell",
                                        cell.isLeave ? "leave" : `level-${cell.level}`,
                                        isToday ? "today" : ""
                                    ].join(" ").trim();

                                    return (
                                        <div
                                            key={idx}
                                            className={cellClass}
                                            title={`${cell.date}: ${cell.label}`}
                                        ></div>
                                    );
                                })}
                            </div>

                            <div className="emp-heatmap-legend">
                                <span>Less</span>
                                <div className="emp-heatmap-legend-cells">
                                    <div className="emp-heatmap-legend-cell" style={{ background: "#e7e7f3" }}></div>
                                    <div className="emp-heatmap-legend-cell" style={{ background: "rgba(0,74,198,0.2)" }}></div>
                                    <div className="emp-heatmap-legend-cell" style={{ background: "rgba(0,74,198,0.5)" }}></div>
                                    <div className="emp-heatmap-legend-cell" style={{ background: "#004ac6" }}></div>
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default EmployeeDashboard;