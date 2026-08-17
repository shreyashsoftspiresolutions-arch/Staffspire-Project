import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import {

    FaTasks, FaHourglassHalf, FaSpinner, FaCheckCircle,
    FaExclamationTriangle, FaEye, FaCalendarAlt, FaPause
} from "react-icons/fa";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

const API = "http://localhost:5000/api";

const priorityConfig = {
    High:   { color: "#ef4444", bg: "#fee2e2", dot: "🔴" },
    Medium: { color: "#d97706", bg: "#fef9c3", dot: "🟡" },
    Low:    { color: "#16a34a", bg: "#dcfce7", dot: "🟢" },
};

const statusConfig = {
    "Pending": { color: "#92400e", bg: "#fef9c3", border: "#fde68a", icon: "🕒" },
    "In Progress": { color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe", icon: "🚧" },
    "Submitted for Review": { color: "#6b21a8", bg: "#f3e8ff", border: "#e9d5ff", icon: "⏳" },
    "Needs Revision": { color: "#9a3412", bg: "#ffedd5", border: "#fed7aa", icon: "⚠️" },
    "On Hold": { color: "#374151", bg: "#f3f4f6", border: "#d1d5db", icon: "⏸️" },
    "Completed": { color: "#14532d", bg: "#dcfce7", border: "#bbf7d0", icon: "✅" },
    "Overdue": { color: "#7f1d1d", bg: "#fee2e2", border: "#fecaca", icon: "🚨" }
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig["Pending"];
    return (
        <span style={{
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
            padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
            whiteSpace: "nowrap"
        }}>
            {cfg.icon} {status}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const cfg = priorityConfig[priority] || priorityConfig["Medium"];
    return (
        <span style={{
            background: cfg.bg, color: cfg.color,
            padding: "3px 9px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
            whiteSpace: "nowrap"
        }}>
            {cfg.dot} {priority}
        </span>
    );
}

function MyTasks() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, onHold: 0, completed: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };


    const tasksUrl = activeTab === "all" ? `${API}/tasks/my` : `${API}/tasks/my?status=${encodeURIComponent(activeTab)}`;
    const { data: tasksData, isLoading: tasksLoading } = useSWR(tasksUrl, fetcher);
    const { data: statsData, isLoading: statsLoading } = useSWR(`${API}/tasks/stats`, fetcher);

    useEffect(() => {
        setLoading((tasksLoading && !tasksData) || (statsLoading && !statsData));
        if (tasksData) setTasks(tasksData.tasks || []);
        if (statsData) setStats(statsData.stats || { total: 0, pending: 0, inProgress: 0, onHold: 0, completed: 0, overdue: 0 });
    }, [tasksData, statsData, tasksLoading, statsLoading]);

    const formatDate = (d) => {
        if (!d) return "—";
        const date = new Date(d);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const dd = new Date(d); dd.setHours(0, 0, 0, 0);

        if (dd.getTime() === today.getTime()) return "Due Today";
        if (dd.getTime() === tomorrow.getTime()) return "Due Tomorrow";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const isDueSoon = (d) => {
        if (!d) return false;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const dd = new Date(d); dd.setHours(0, 0, 0, 0);
        const diff = (dd - today) / (1000 * 60 * 60 * 24);
        return diff <= 2 && diff >= 0;
    };

    const tabs = [
        { key: "all",         label: "All",         count: stats.total },
        { key: "Pending",     label: "⏳ Pending",   count: stats.pending },
        { key: "In Progress", label: "🚧 In Progress", count: stats.inProgress },
        { key: "On Hold",     label: "⏸ On Hold",   count: stats.onHold },
        { key: "Completed",   label: "✅ Completed", count: stats.completed },
        { key: "Overdue",     label: "❌ Overdue",   count: stats.overdue },
    ];

    const statCards = [
        { label: "Total Tasks", value: stats.total, icon: <FaTasks />, color: "#4f8cff", bg: "#eff6ff" },
        { label: "Pending", value: stats.pending, icon: <FaHourglassHalf />, color: "#f59e0b", bg: "#fef9c3" },
        { label: "In Progress", value: stats.inProgress, icon: <FaSpinner />, color: "#3b82f6", bg: "#dbeafe" },
        { label: "On Hold", value: stats.onHold, icon: <FaPause />, color: "#6b7280", bg: "#f3f4f6" },
        { label: "Completed", value: stats.completed, icon: <FaCheckCircle />, color: "#22c55e", bg: "#dcfce7" },
        { label: "Overdue", value: stats.overdue, icon: <FaExclamationTriangle />, color: "#ef4444", bg: "#fee2e2" },
    ];

    return (
        <DashboardLayout>
            <div className="attendance-page-container">
                {/* Header */}
                <div className="employee-header" style={{ marginBottom: "24px" }}>
                    <h1 className="page-title" style={{ margin: 0 }}>My Tasks</h1>
                </div>

                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                    {statCards.map(({ label, value, icon, color, bg }) => (
                        <div key={label} style={{ background: "white", borderRadius: "14px", padding: "18px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{label}</span>
                                <span style={{ background: bg, color, padding: "6px", borderRadius: "8px", fontSize: "14px", display: "flex" }}>{icon}</span>
                            </div>
                            <div style={{ fontSize: "26px", fontWeight: "800", color: "#1e293b" }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Status Tabs */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                    {tabs.map(({ key, label, count }) => (
                        <button type="button" key={key} onClick={() => setActiveTab(key)}
                            style={{
                                padding: "8px 16px", borderRadius: "30px", border: "1.5px solid",
                                borderColor: activeTab === key ? "#4f8cff" : "#e2e8f0",
                                background: activeTab === key ? "#4f8cff" : "white",
                                color: activeTab === key ? "white" : "#475569",
                                fontWeight: "600", fontSize: "13px", cursor: "pointer",
                                display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s"
                            }}>
                            {label}
                            <span style={{
                                background: activeTab === key ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                                color: activeTab === key ? "white" : "#64748b",
                                padding: "1px 7px", borderRadius: "10px", fontSize: "12px", fontWeight: "700"
                            }}>{count}</span>
                        </button>
                    ))}
                </div>

                {/* Task Cards */}
                {loading ? (
                    <div style={{ textAlign: "center", color: "#64748b", padding: "60px 0" }}>Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                        <p style={{ color: "#64748b", fontWeight: "600", fontSize: "16px" }}>No tasks in this category.</p>
                    </div>
                ) : (
                    <div className="table-container-custom">
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>Task ID</th>
                                    <th>Title</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Due Date</th>
                                    <th>Assigned By</th>
                                    <th style={{ textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id}>
                                        <td><span style={{ fontFamily: "monospace", fontWeight: "700", color: "#4f8cff", fontSize: "13px" }}>{task.task_id || `#${task.id}`}</span></td>
                                        <td style={{ maxWidth: "200px" }}>
                                            <span style={{ fontWeight: "600", color: "#1e293b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                {task.task_title}
                                            </span>
                                        </td>
                                        <td><PriorityBadge priority={task.priority} /></td>
                                        <td><StatusBadge status={task.status} /></td>
                                        <td style={{ whiteSpace: "nowrap", color: task.status === "Overdue" ? "#ef4444" : "#475569", fontWeight: task.status === "Overdue" ? "700" : "500" }}>
                                            {formatDate(task.deadline)}
                                        </td>
                                        <td style={{ fontSize: "13px", color: "#64748b" }}>{task.assigned_by || "—"}</td>
                                        <td style={{ textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                                <button type="button"
                                                    onClick={() => navigate(`/employee/tasks/${task.id}`)}
                                                    title="View / Edit"
                                                    style={{ background: "#eff6ff", color: "#2563eb", border: "1.5px solid #bfdbfe", width: "34px", height: "34px", borderRadius: "8px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.color = "white"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; }}
                                                ><FaEye /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default MyTasks;
