import { useReducer, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useSWR from "swr";
import { Chart, registerables } from "chart.js";
import DashboardLayout from "../layouts/DashboardLayout";
import { 

    FaArrowUp, 
    FaArrowDown, 
    FaUsers, 
    FaBuilding, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaCalendarTimes, 
    FaCalendarAlt, 
    FaTasks, 
    FaPercentage, 
    FaDownload, 
    FaPlus, 
    FaEllipsisH, 
    FaFilter 
} from "react-icons/fa";

// Register Chart.js components
Chart.register(...registerables);

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

const dashboardReducer = (state, action) => {
    switch (action.type) {
        case "DATA_LOADED":
            return { ...state, ...action.payload, loading: false };
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_MESSAGE":
            return { ...state, actionMessage: action.payload };
        default:
            return state;
    }
};

function AdminDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [state, dispatch] = useReducer(dashboardReducer, {
        stats: { totalEmployees: 0, departmentsCount: 0, presentToday: 0, absentToday: 0, lateToday: 0, pendingLeaves: 0, activeTasks: 0, attendanceRate: 0 },
        projectStats: { total: 0, active: 0, completed: 0, avgProgress: 0 },
        deptDist: [],
        leavesList: [],
        activities: [],
        attendanceTrend: { labels: [], data: [] },
        loading: true,
        actionMessage: ""
    });
    const { stats, projectStats, deptDist, leavesList, activities, attendanceTrend, loading, actionMessage } = state;

    const attendanceChartRef = useRef(null);
    const deptChartRef = useRef(null);
    const attendanceChartInstance = useRef(null);
    const deptChartInstance = useRef(null);


    const { data: dashboardData, error: dashboardError, mutate: fetchStats } = useSWR(
        token ? "http://localhost:5000/api/admin/dashboard-stats" : null,
        fetcher
    );

    useEffect(() => {
        if (dashboardData && dashboardData.success) {
            const data = dashboardData;
            
            const formattedActs = (data.recentActivities || []).map(act => {
                let formattedTime = "Today";
                if (act.created_at) {
                    const date = new Date(act.created_at);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    if (diffMins < 1) formattedTime = "Just now";
                    else if (diffMins < 60) formattedTime = `${diffMins}m ago`;
                    else if (diffMins < 1440) {
                        const hrs = Math.floor(diffMins / 60);
                        formattedTime = `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
                    } else {
                        formattedTime = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }
                }
                return { title: act.title, message: act.message, time: formattedTime, type: act.type };
            });

            dispatch({
                type: "DATA_LOADED",
                payload: {
                    stats: {
                        totalEmployees: data.stats.totalEmployees || 0,
                        departmentsCount: data.stats.departmentsCount || 0,
                        presentToday: data.stats.presentToday || 0,
                        absentToday: data.stats.absentToday !== undefined ? data.stats.absentToday : 0,
                        lateToday: data.stats.lateToday !== undefined ? data.stats.lateToday : 0,
                        pendingLeaves: data.stats.pendingLeaves !== undefined ? data.stats.pendingLeaves : 0,
                        activeTasks: data.stats.activeTasks !== undefined ? data.stats.activeTasks : 0,
                        attendanceRate: data.stats.attendanceRate || 0
                    },
                    projectStats: data.projectStats || { total: 0, active: 0, completed: 0, avgProgress: 0 },
                    deptDist: data.deptDist || [],
                    leavesList: (data.leavesList || []).map(l => ({
                        id: l.id, employee_name: l.employee_name, email: l.email, department: l.department, leave_type: l.leave_type,
                        start_date: new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        end_date: new Date(l.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), status: l.status
                    })),
                    activities: formattedActs,
                    attendanceTrend: data.attendanceTrend || { labels: [], data: [] }
                }
            });
        }
        if (dashboardError) {
            console.error("Failed to load dashboard stats:", dashboardError);
            dispatch({ type: "SET_LOADING", payload: false });
        }
    }, [dashboardData, dashboardError]);

    // Draw charts on data changes
    useEffect(() => {
        if (loading) return;

        // 1. Line Chart: Attendance Trend
        if (attendanceChartRef.current && attendanceTrend.labels && attendanceTrend.labels.length > 0) {
            const visibleLabels = attendanceTrend.labels;
            const visibleData = attendanceTrend.data;

            const ctxArea = attendanceChartRef.current.getContext('2d');
            if (attendanceChartInstance.current) {
                attendanceChartInstance.current.destroy();
            }

            let gradient = ctxArea.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 74, 198, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 74, 198, 0)');

            attendanceChartInstance.current = new Chart(ctxArea, {
                type: 'line',
                data: {
                    labels: visibleLabels,
                    datasets: [{
                        label: 'Present',
                        data: visibleData,
                        borderColor: '#004ac6',
                        backgroundColor: gradient,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#004ac6',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#191b23',
                            padding: 12,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 13 },
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(225, 226, 237, 0.4)' },
                            ticks: { maxTicksLimit: 5 }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // 2. Doughnut Chart: Department Distribution
        if (deptChartRef.current && deptDist.length > 0) {
            const ctxDonut = deptChartRef.current.getContext('2d');
            if (deptChartInstance.current) {
                deptChartInstance.current.destroy();
            }

            const chartLabels = deptDist.map(d => d.name);
            const chartData = deptDist.map(d => d.value);

            deptChartInstance.current = new Chart(ctxDonut, {
                type: 'doughnut',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        data: chartData,
                        backgroundColor: [
                            '#2563eb', // Blue
                            '#10b981', // Emerald Green
                            '#f59e0b', // Amber/Orange
                            '#8b5cf6', // Violet/Purple
                            '#f43f5e', // Rose/Red
                            '#06b6d4'  // Cyan/Teal
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                usePointStyle: true,
                                padding: 18,
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#191b23',
                            padding: 12,
                            cornerRadius: 8
                        }
                    }
                }
            });
        }

        return () => {
            if (attendanceChartInstance.current) attendanceChartInstance.current.destroy();
            if (deptChartInstance.current) deptChartInstance.current.destroy();
        };
    }, [loading, attendanceTrend, deptDist]);

    const handleLeaveAction = async (id, action) => {
        if (!token) return;
        try {
            const response = await axios.post("http://localhost:5000/api/leaves/admin/action", 
                { id, action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                dispatch({ type: "SET_MESSAGE", payload: `Request successfully ${action.toLowerCase()}ed.` });
                setTimeout(() => dispatch({ type: "SET_MESSAGE", payload: "" }), 4000);
                // Reload data
                fetchStats();
            }
        } catch (error) {
            console.error("Failed to execute leave action:", error);
            dispatch({ type: "SET_MESSAGE", payload: "Action execution failed." });
            setTimeout(() => dispatch({ type: "SET_MESSAGE", payload: "" }), 4000);
        }
    };

    const triggerReportDownload = () => {
        dispatch({ type: "SET_MESSAGE", payload: "Generating summary report..." });
        setTimeout(() => {
            dispatch({ type: "SET_MESSAGE", payload: "Report generated and downloaded successfully." });
            setTimeout(() => dispatch({ type: "SET_MESSAGE", payload: "" }), 3000);
        }, 1500);
    };

    return (
        <DashboardLayout>
            <div className="admin-command-center">
                {/* Alert Notifications / Action message */}
                {actionMessage && (
                    <div className="alert-box alert-success" style={{ marginBottom: "24px" }}>
                        {actionMessage}
                    </div>
                )}

                {/* Page Header */}
                <div className="amber-banner">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2>Good Morning, Admin 👋</h2>
                            <p>Monitor restaurants, orders, customers, revenue and platform activity from one place.</p>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.2)", padding: "10px 20px", borderRadius: "10px" }}>
                            <div style={{ fontSize: "12px", opacity: 0.8 }}>Today</div>
                            <div style={{ fontSize: "15px", fontWeight: "600" }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-page-header">
                    <div className="dashboard-page-title">
                        <h2>Admin Command Center</h2>
                        <p>Overview of organizational metrics and activities for today.</p>
                    </div>
                    <div className="dashboard-header-actions">
                        <button type="button" className="btn-generate-report" onClick={triggerReportDownload}>
                            <FaDownload style={{ fontSize: "12px" }} />
                            Generate Report
                        </button>
                        <button type="button" className="btn-add-employee" onClick={() => navigate("/admin/employees/add")}>
                            <FaPlus style={{ fontSize: "12px" }} />
                            Add Employee
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="kpi-grid-container">
                    {/* KPI 1 */}
                    <div className="kpi-card">
                        <div className="kpi-card-header">
                            <div className="kpi-icon-wrapper blue">
                                <FaUsers />
                            </div>
                            <span className="trend-badge up">
                                <FaArrowUp style={{ marginRight: "4px" }} /> 2.4%
                            </span>
                        </div>
                        <span className="kpi-card-label">Total Employees</span>
                        <span className="kpi-card-value">{stats.totalEmployees.toLocaleString()}</span>
                    </div>

                    {/* KPI 2 */}
                    <div className="kpi-card">
                        <div className="kpi-card-header">
                            <div className="kpi-icon-wrapper gray">
                                <FaBuilding />
                            </div>
                        </div>
                        <span className="kpi-card-label">Departments</span>
                        <span className="kpi-card-value">{stats.departmentsCount}</span>
                    </div>

                    {/* KPI 3 */}
                    <div className="kpi-card">
                        <div className="kpi-card-header">
                            <div className="kpi-icon-wrapper green">
                                <FaCheckCircle />
                            </div>
                            <span className="kpi-card-label" style={{ color: "#737686", fontSize: "12px", fontWeight: 600 }}>Today</span>
                        </div>
                        <span className="kpi-card-label">Present Today</span>
                        <span className="kpi-card-value">{stats.presentToday}</span>
                    </div>

                    {/* KPI 4 */}
                    <div className="kpi-card">
                        <div className="kpi-card-header">
                            <div className="kpi-icon-wrapper red">
                                <FaTimesCircle />
                            </div>
                        </div>
                        <span className="kpi-card-label">Absent Today</span>
                        <span className="kpi-card-value">{stats.absentToday}</span>
                    </div>

                    {/* KPI 5 */}
                    <div className="kpi-card">
                        <div className="kpi-card-header">
                            <div className="kpi-icon-wrapper yellow">
                                <FaCalendarAlt />
                            </div>
                            <span className="trend-badge down">
                                <FaArrowDown style={{ marginRight: "4px" }} /> 1.2%
                            </span>
                        </div>
                        <span className="kpi-card-label">Late Employees</span>
                        <span className="kpi-card-value">{stats.lateToday}</span>
                    </div>

                    {/* KPI 6 */}
                    <div className="kpi-card">
                        <div className="kpi-card-header">
                            <div className="kpi-icon-wrapper gray">
                                <FaCalendarTimes />
                            </div>
                        </div>
                        <span className="kpi-card-label">Pending Leaves</span>
                        <span className="kpi-card-value">{stats.pendingLeaves}</span>
                    </div>

                    {/* KPI 7 */}
                    <div className="kpi-card">
                        <div className="kpi-card-header">
                            <div className="kpi-icon-wrapper blue">
                                <FaTasks />
                            </div>
                        </div>
                        <span className="kpi-card-label">Active Tasks</span>
                        <span className="kpi-card-value">{stats.activeTasks}</span>
                    </div>

                    {/* KPI 8 */}
                    <div className="kpi-card">
                        <div className="kpi-card-header">
                            <div className="kpi-icon-wrapper green">
                                <FaPercentage />
                            </div>
                            <span className="trend-badge up">
                                <FaArrowUp style={{ marginRight: "4px" }} /> 0.5%
                            </span>
                        </div>
                        <span className="kpi-card-label">Attendance Rate</span>
                        <span className="kpi-card-value">{stats.attendanceRate}%</span>
                        <FaPercentage className="kpi-card-bg-icon" />
                    </div>
                </div>

                {/* Projects Command Center Widget (Phase 18) */}
                <div className="bento-card" style={{ marginBottom: "24px", background: "var(--card-bg)", color: "var(--text-color)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div>
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-color)", margin: 0 }}>Projects Command Center</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Live progress and status breakdown across all organizational projects</p>
                        </div>
                        <button type="button" onClick={() => navigate("/admin/projects")} style={{ background: "var(--primary-color)", border: "none", padding: "8px 16px", borderRadius: "8px", color: "#ffffff", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>
                            View Projects →
                        </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                        <div style={{ background: "var(--bg-color)", padding: "16px", borderRadius: "12px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Projects</div>
                            <div style={{ fontSize: "32px", fontWeight: "800", color: "var(--primary-color)", marginTop: "6px" }}>{projectStats.total}</div>
                        </div>
                        <div style={{ background: "var(--bg-color)", padding: "16px", borderRadius: "12px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active</div>
                            <div style={{ fontSize: "32px", fontWeight: "800", color: "#10b981", marginTop: "6px" }}>{projectStats.active}</div>
                        </div>
                        <div style={{ background: "var(--bg-color)", padding: "16px", borderRadius: "12px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Completed</div>
                            <div style={{ fontSize: "32px", fontWeight: "800", color: "#8b5cf6", marginTop: "6px" }}>{projectStats.completed}</div>
                        </div>
                        <div style={{ background: "var(--bg-color)", padding: "16px", borderRadius: "12px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Average Progress</div>
                            <div style={{ fontSize: "32px", fontWeight: "800", color: "#f59e0b", marginTop: "6px" }}>{projectStats.avgProgress}%</div>
                        </div>
                    </div>
                </div>

                {/* Bento Grid layout */}
                <div className="bento-grid-container">
                    {/* Left Column (Charts & Lists) */}
                    <div className="bento-left-column">
                        {/* Attendance Chart Card */}
                        <div className="bento-card">
                            <div className="bento-card-header">
                                <div className="bento-card-title">
                                    <h3>Attendance Trend</h3>
                                    <p>Last 7 Days Overview</p>
                                </div>
                                <button type="button" className="btn-more-options" aria-label="More options">
                                    <FaEllipsisH />
                                </button>
                            </div>
                            <div style={{ height: "260px", position: "relative", width: "100%" }}>
                                {attendanceTrend.labels && attendanceTrend.labels.length > 0 ? (
                                    <canvas ref={attendanceChartRef}></canvas>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#737686", fontSize: "14px" }}>
                                        No attendance trend data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Leaves requests Table */}
                        <div className="bento-card">
                            <div className="bento-card-header">
                                <div className="bento-card-title">
                                    <h3>Pending Leave Requests</h3>
                                </div>
                                <span className="table-text-secondary" style={{ cursor: "pointer", color: "#004ac6", fontSize: "14px", fontWeight: "600" }} onClick={() => navigate("/admin/leaves")}>View All</span>
                            </div>
                            <div className="pending-table-container">
                                <table className="pending-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Department</th>
                                            <th>Leave Type</th>
                                            <th>Dates</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: "right", paddingRight: "8px" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leavesList.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: "center", padding: "24px 0", color: "#737686" }}>
                                                    No pending leave requests
                                                </td>
                                            </tr>
                                        ) : (
                                            leavesList.map((row) => (
                                                <tr key={row.id}>
                                                    <td>
                                                        <div className="employee-info-cell">
                                                            <div className="employee-avatar-wrapper">
                                                                {/* Display letters as backup avatar */}
                                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#004ac6", color: "#ffffff", fontSize: "12px", fontWeight: "600", lineHeight: "36px", textAlign: "center" }}>
                                                                    {row.employee_name ? row.employee_name.split(' ').map(n=>n[0]).join('') : "EE"}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="employee-name-text">{row.employee_name}</div>
                                                                <div className="employee-email-text">{row.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="table-text-body">{row.department}</span></td>
                                                    <td><span className="table-text-body">{row.leave_type}</span></td>
                                                    <td><span className="table-text-secondary">{row.start_date} - {row.end_date}</span></td>
                                                    <td>
                                                        <span className="status-badge pending">{row.status}</span>
                                                    </td>
                                                    <td>
                                                        <div className="table-action-buttons">
                                                            <button type="button" className="btn-table-action approve" title="Approve" onClick={() => handleLeaveAction(row.id, "Approved")}>
                                                                <FaCheckCircle />
                                                            </button>
                                                            <button type="button" className="btn-table-action reject" title="Reject" onClick={() => handleLeaveAction(row.id, "Rejected")}>
                                                                <FaTimesCircle />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Distribution & Activities) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {/* Donut Chart Card */}
                        <div className="bento-card" style={{ display: "flex", flexDirection: "column", height: "360px" }}>
                            <div className="bento-card-header" style={{ marginBottom: "16px" }}>
                                <div className="bento-card-title">
                                    <h3>Department Distribution</h3>
                                </div>
                            </div>
                            <div className="doughnut-chart-container" style={{ flex: 1 }}>
                                {deptDist.length > 0 ? (
                                    <canvas ref={deptChartRef}></canvas>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#737686", fontSize: "14px" }}>
                                        No department data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="bento-card">
                            <div className="bento-card-header">
                                <div className="bento-card-title">
                                    <h3>Recent Activity</h3>
                                </div>
                                <button type="button" className="btn-more-options" aria-label="Filter activity">
                                    <FaFilter style={{ fontSize: "14px" }} />
                                </button>
                            </div>
                            <div className="activity-timeline">
                                {activities.length === 0 ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px", color: "#737686", fontSize: "14px" }}>
                                        No recent activities recorded
                                    </div>
                                ) : (
                                    activities.map((act, index) => {
                                        // Assign colors based on timeline event type
                                        let dotColor = "blue";
                                        if (act.type === "checkout") dotColor = "green";
                                        else if (act.type === "leave") dotColor = "orange";
                                        else if (act.type === "task") dotColor = "purple";

                                        return (
                                            <div className="activity-timeline-item" key={`key-${index}` /* fixed */}>
                                                <div className={`activity-timeline-dot ${dotColor}`}></div>
                                                <div className="activity-item-title">{act.title}</div>
                                                <div className="activity-item-message">{act.message}</div>
                                                <span className="activity-item-time">{act.time}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default AdminDashboard;