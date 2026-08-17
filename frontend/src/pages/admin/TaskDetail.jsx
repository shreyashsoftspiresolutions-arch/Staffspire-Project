import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import {
    FaArrowLeft, FaEdit, FaCheck, FaTimes, FaCalendarAlt,
    FaUser, FaBuilding, FaFlag, FaStickyNote, FaClock, FaIdBadge, FaTrashAlt, FaSpinner
} from "react-icons/fa";
import TaskCompletionModal from "./components/TaskCompletionModal";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

const API = "http://localhost:5000/api";

const priorityConfig = {
    Critical: { color: "#991b1b", bg: "#fef2f2", border: "#f87171", dot: "🔥" },
    High:   { color: "#ef4444", bg: "#fee2e2", border: "#fecaca", dot: "🔴" },
    Medium: { color: "#d97706", bg: "#fef9c3", border: "#fde68a", dot: "🟡" },
    Low:    { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", dot: "🟢" },
};

const statusConfig = {
    "Pending":     { color: "#92400e", bg: "#fef9c3", border: "#fde68a" },
    "In Progress": { color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe" },
    "Submitted for Review": { color: "#6b21a8", bg: "#f3e8ff", border: "#e9d5ff" },
    "Needs Revision": { color: "#9a3412", bg: "#ffedd5", border: "#fed7aa" },
    "On Hold":     { color: "#374151", bg: "#f3f4f6", border: "#d1d5db" },
    "Completed":   { color: "#14532d", bg: "#dcfce7", border: "#bbf7d0" },
    "Overdue":     { color: "#7f1d1d", bg: "#fee2e2", border: "#fecaca" },
};

function TaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const isEmployee = user.role === "Employee";
    const isAdminOrManager = user.role === "Admin" || user.role === "Manager";

    const [task, setTask] = useState(null);

    const isProjectManager = task && (String(user.login_id) === String(task.project_manager_id) || String(user.id) === String(task.project_manager_id));

    const isAssignedToMe = task && (
        String(task.employee_id) === String(user.login_id) ||
        String(task.employee_id) === String(user.employee_id) ||
        String(task.employee_id) === String(user.id) ||
        (task.employee_name && user.name && String(task.employee_name).trim().toLowerCase() === String(user.name).trim().toLowerCase()) ||
        isProjectManager
    );
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [commitToRemove, setCommitToRemove] = useState(null);
    const [submissionToDelete, setSubmissionToDelete] = useState(null);

    const [editForm, setEditForm] = useState({});
    
    // Evidence fields for Edit Task
    const [evidenceFile, setEvidenceFile] = useState([]);
    const [reviewComments, setReviewComments] = useState("");

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const showNotification = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };



    const { data: taskData, isLoading: taskLoading, mutate: fetchTask } = useSWR(`${API}/tasks/${id}`, fetcher);
    const { data: empData } = useSWR(isAdminOrManager ? `${API}/employees` : null, fetcher);

    useEffect(() => {
        setLoading(taskLoading && !taskData);
        if (taskData && taskData.task) {
            setTask(taskData.task);
            setEditForm(taskData.task);
        }
    }, [taskData, taskLoading]);

    useEffect(() => {
        if (empData) {
            setEmployees(empData.employees || []);
        }
    }, [empData]);

    const targetDept = task?.proj_dept || task?.department || task?.emp_dept || "";
    const assignableEmployees = task?.project_members?.length > 0
        ? employees.filter(emp => task.project_members.includes(emp.employee_id) || String(emp.employee_id) === String(task.project_manager_id))
        : targetDept
            ? employees.filter(emp => emp.department === targetDept || emp.employee_id === task?.employee_id)
            : employees;

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const formData = new FormData();
            
            // Append standard fields
            Object.keys(editForm).forEach(key => {
                if (editForm[key] !== null && editForm[key] !== undefined) {
                    formData.append(key, editForm[key]);
                }
            });

            // Append files
            if (evidenceFile && evidenceFile.length > 0) {
                for (let i = 0; i < evidenceFile.length; i++) {
                    formData.append("attachments", evidenceFile[i]);
                }
            }

            await axios.put(`${API}/tasks/${id}`, formData, { 
                headers: { ...headers, "Content-Type": "multipart/form-data" } 
            });
            showNotification("success", "Task updated successfully.");
            setEditing(false);
            setEvidenceFile([]);
            fetchTask();
        } catch (err) {
            showNotification("error", err.response?.data?.message || "Update failed.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveCommit = (submissionId, commitHash) => {
        setCommitToRemove({ submissionId, commitHash });
    };

    const confirmRemoveCommit = async () => {
        if (!commitToRemove) return;
        const { submissionId, commitHash } = commitToRemove;
        try {
            setActionLoading(true);
            await axios.delete(`${API}/tasks/${id}/submissions/${submissionId}/commits/${commitHash}`, { headers });
            showNotification("success", "Commit removed successfully.");
            setCommitToRemove(null);
            fetchTask();
        } catch (err) {
            showNotification("error", err.response?.data?.message || "Failed to remove commit.");
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDeleteSubmission = async () => {
        if (!submissionToDelete) return;
        try {
            setActionLoading(true);
            await axios.delete(`${API}/tasks/${id}/submissions/${submissionToDelete}`, { headers });
            showNotification("success", "Submission deleted successfully.");
            setSubmissionToDelete(null);
            fetchTask();
        } catch (err) {
            showNotification("error", err.response?.data?.message || "Failed to delete submission.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleManagerReview = async (status) => {
        try {
            setActionLoading(true);
            const submissionId = task.submissions?.[0]?.id;
            if (!submissionId) {
                showNotification("error", "No submission found.");
                return;
            }
            await axios.post(`${API}/tasks/${id}/submissions/${submissionId}/review`, { status, review_comments: reviewComments }, { headers });
            showNotification("success", `Submission ${status === 'Approved' ? 'approved' : 'revision requested'}.`);
            setReviewComments("");
            fetchTask();
        } catch (err) {
            showNotification("error", err.response?.data?.message || "Failed to submit review.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
        try {
            setActionLoading(true);
            await axios.delete(`${API}/tasks/${id}`, { headers });
            showNotification("success", "Task deleted successfully.");
            setTimeout(() => navigate(backPath), 1500);
        } catch (err) {
            showNotification("error", err.response?.data?.message || "Failed to delete task.");
            setActionLoading(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    const backPath = isEmployee ? "/employee/tasks" : "/admin/tasks";

    if (loading) return (
        <DashboardLayout>
            <div className="attendance-page-container">
                <p style={{ color: "#64748b", padding: "60px 0", textAlign: "center" }}>Loading task details...</p>
            </div>
        </DashboardLayout>
    );

    if (!task) return (
        <DashboardLayout>
            <div className="attendance-page-container">
                <p style={{ color: "#ef4444", padding: "60px 0", textAlign: "center" }}>Task not found.</p>
            </div>
        </DashboardLayout>
    );

    const priCfg = priorityConfig[task.priority] || priorityConfig["Medium"];
    const stsCfg = statusConfig[task.status] || statusConfig["Pending"];

    return (
        <DashboardLayout>
            <div className="attendance-page-container">
                {/* Back */}
                <button type="button" onClick={() => navigate(backPath)} className="back-link-btn"
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--primary, #2563eb)", fontWeight: "600", fontSize: "14px", marginBottom: "24px", padding: 0 }}>
                    <FaArrowLeft /> Back to Tasks
                </button>

                {message && <div className={`alert-banner alert-${message.type}`} style={{ marginBottom: "20px" }}>{message.text}</div>}

                {/* Hero header card */}
                <div style={{ background: "white", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                <span className="task-id-badge" style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "700", color: "var(--primary, #2563eb)", background: "rgba(37, 99, 235, 0.1)", padding: "4px 10px", borderRadius: "6px" }}>
                                    {task.task_id || `#${task.id}`}
                                </span>
                                <span style={{ background: priCfg.bg, color: priCfg.color, padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>
                                    {priCfg.dot} {task.priority}
                                </span>
                            </div>
                            <h1 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: "#1e293b" }}>{task.task_title}</h1>
                            {task.department && <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Department: <strong>{task.department}</strong></p>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ background: stsCfg.bg, color: stsCfg.color, border: `1.5px solid ${stsCfg.border}`, padding: "8px 20px", borderRadius: "30px", fontWeight: "700", fontSize: "14px" }}>
                                {task.status}
                            </span>
                            {(!editing && (isAdminOrManager || isAssignedToMe)) && (
                                <>
                                    <button type="button" onClick={() => setEditing(true)} className="btn-edit-task"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--primary, #2563eb)", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                                        <FaEdit /> Edit Task
                                    </button>
                                    {isAdminOrManager && (
                                        <button type="button" onClick={handleDeleteTask} className="btn-delete-task"
                                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ef4444", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                                            <FaTrashAlt /> Delete Task
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                    {[
                        { icon: <FaUser />, label: "Assigned To", value: task.employee_name || task.employee_id },
                        { icon: <FaUser />, label: "Assigned By", value: task.assigned_by || "—" },
                        { icon: <FaBuilding />, label: "Department", value: task.department || "—" },
                        { icon: <FaFlag />, label: "Priority", value: `${priCfg.dot} ${task.priority}` },
                        { icon: <FaCalendarAlt />, label: "Due Date", value: formatDate(task.deadline) },
                        { icon: <FaClock />, label: "Created On", value: formatDate(task.created_at) },
                        { icon: <FaCalendarAlt />, label: "Completed On", value: task.completion_date ? formatDate(task.completion_date) : "Not yet" },
                        { icon: <FaIdBadge />, label: "Employee ID", value: task.employee_id },
                    ].map(({ icon, label, value }) => (
                        <div key={label} style={{ background: "white", borderRadius: "12px", padding: "18px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                            <span className="task-detail-icon" style={{ color: "var(--primary, #2563eb)", fontSize: "16px", marginTop: "2px", flexShrink: 0 }}>{icon}</span>
                            <div>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
                                <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Task Submissions / Evidence */}
                {task.submissions && task.submissions.length > 0 && (
                    <div style={{ background: "white", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>Task Submissions / Evidence</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {task.submissions.map((sub, index) => (
                                <div key={sub.id} style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #cbd5e1", paddingBottom: "8px" }}>
                                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>Submission #{task.submissions.length - index}</span>
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>{new Date(sub.submitted_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: "600", padding: "4px 8px", borderRadius: "4px", backgroundColor: sub.review_status === 'Approved' ? '#dcfce7' : sub.review_status === 'Rejected' ? '#fee2e2' : '#fef9c3', color: sub.review_status === 'Approved' ? '#166534' : sub.review_status === 'Rejected' ? '#991b1b' : '#a16207' }}>
                                                {sub.review_status}
                                            </div>
                                            {sub.review_status !== 'Approved' && (
                                                <button onClick={() => setSubmissionToDelete(sub.id)} title="Delete submission" style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "15px", display: "flex", alignItems: "center", padding: "4px" }}>
                                                    <FaTrashAlt />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#334155", fontWeight: "600" }}>Summary: <span style={{ fontWeight: "400" }}>{sub.summary}</span></p>
                                    
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "14px", color: "#1e293b", background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ width: "100%", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Evidence Type: {sub.evidence_type}</div>
                                        
                                        {sub.branch_name && <div><strong>Branch:</strong> <span style={{ fontFamily: "monospace", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{sub.branch_name}</span></div>}
                                        {sub.commit_hash && (
                                            <div>
                                                <strong>Commits:</strong>{' '}
                                                <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                                                    {sub.commit_hash.split(',').map(h => h.trim()).filter(Boolean).map((hash, idx) => (
                                                        <span key={idx} style={{ display: "inline-flex", alignItems: "center", background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                                            {sub.repository_url ? (
                                                                <a href={`${sub.repository_url.trim().replace(/\.git$/, '').replace(/\/$/, '')}/commit/${hash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary, #2563eb)", fontFamily: "monospace", textDecoration: "none", fontWeight: "600" }}>
                                                                    {hash.substring(0, 7)}
                                                                </a>
                                                            ) : (
                                                                <span style={{ fontFamily: "monospace", fontWeight: "600" }}>
                                                                    {hash.substring(0, 7)}
                                                                </span>
                                                            )}
                                                            {sub.review_status !== 'Approved' && (
                                                                <button onClick={() => handleRemoveCommit(sub.id, hash)} title="Remove commit" style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", marginLeft: "6px", padding: "0 2px", fontSize: "14px", display: "flex", alignItems: "center" }}>
                                                                    <FaTimes />
                                                                </button>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {sub.pull_request_url && <div><strong>PR:</strong> <a href={sub.pull_request_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary, #2563eb)" }}>View Pull Request</a></div>}
                                        {sub.demo_url && <div><strong>Demo:</strong> <a href={sub.demo_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary, #2563eb)" }}>{sub.demo_url}</a></div>}
                                    </div>
                                    
                                    {sub.file_paths && Array.isArray(sub.file_paths) && sub.file_paths.length > 0 && (
                                        <div style={{ marginTop: "12px", background: "#f0fdf4", padding: "12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                            <strong style={{ fontSize: "13px", color: "#166534", display: "block", marginBottom: "8px" }}>Attachments:</strong>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                                {sub.file_paths.map((file, i) => (
                                                    <a key={i} href={`http://localhost:5000/uploads/${file}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", background: "#fff", padding: "6px 12px", borderRadius: "6px", color: "#2563eb", textDecoration: "none", border: "1px solid #dbeafe" }}>
                                                        📎 {file.split('-').slice(2).join('-') || file}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sub.notes && <p style={{ margin: "12px 0 0", color: "#475569", fontSize: "14px", padding: "8px", background: "#f1f5f9", borderRadius: "6px" }}><strong>Notes:</strong> {sub.notes}</p>}
                                    
                                    {sub.review_comments && (
                                        <div style={{ marginTop: "12px", padding: "12px", background: sub.review_status === 'Approved' ? '#f0fdf4' : '#fef2f2', borderLeft: `4px solid ${sub.review_status === 'Approved' ? '#166534' : '#991b1b'}`, borderRadius: "4px" }}>
                                            <strong style={{ fontSize: "13px", color: sub.review_status === 'Approved' ? '#166534' : '#991b1b' }}>Manager Feedback:</strong>
                                            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#1e293b" }}>{sub.review_comments}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                {task.description && (
                    <div style={{ background: "white", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                            <FaStickyNote className="task-detail-icon" style={{ color: "var(--primary, #2563eb)" }} />
                            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>Description</h3>
                        </div>
                        <p className="task-desc-box" style={{ margin: 0, color: "#475569", lineHeight: "1.8", background: "#f8fafc", padding: "16px", borderRadius: "8px", borderLeft: "4px solid var(--primary, #2563eb)" }}>
                            {task.description}
                        </p>
                    </div>
                )}

                {/* Remarks */}
                {task.remarks && !editing && (
                    <div style={{ background: "white", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "20px", borderLeft: "4px solid #f59e0b" }}>
                        <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: "700", color: "#92400e" }}>Remarks / Completion Notes</h3>
                        <p style={{ margin: 0, color: "#475569", lineHeight: "1.8" }}>{task.remarks}</p>
                    </div>
                )}

                {/* ─── EDIT FORM ─── */}
                {editing && (
                    <div style={{ background: "white", borderRadius: "16px", padding: "28px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ margin: 0, fontWeight: "700", fontSize: "18px" }}>Edit Task</h2>
                            <button type="button" onClick={() => setEditing(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "18px" }}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTask} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {isAdminOrManager && (
                                <>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Task Title</label>
                                        <input aria-label="Task Title" type="text" value={editForm.task_title || ""} onChange={e => setEditForm({ ...editForm, task_title: e.target.value })} required />
                                    </div>

                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Description</label>
                                        <textarea aria-label="Description" value={editForm.description || ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            rows="3" style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", resize: "none", fontSize: "14px" }} />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Assign To</label>
                                            <select aria-label="Assign To" value={editForm.employee_id || ""} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value, employee_id: e.target.value })}
                                                style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", fontSize: "14px" }}>
                                                {assignableEmployees.map(emp => (
                                                    <option key={emp.employee_id} value={emp.employee_id}>
                                                        {emp.first_name} {emp.last_name} ({emp.department || "No Dept"})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Due Date</label>
                                            <input aria-label="Due Date" type="date" value={editForm.deadline ? editForm.deadline.split("T")[0] : ""} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {isAdminOrManager && (
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Priority</label>
                                        <select aria-label="Priority" value={editForm.priority || "Medium"} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                                            style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", fontSize: "14px" }}>
                                            <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                                        </select>
                                    </div>
                                )}
                                <div className="form-group" style={{ margin: 0, gridColumn: isAdminOrManager ? "auto" : "1 / -1" }}>
                                    <label>Status</label>
                                    <select aria-label="Status" value={editForm.status || "Pending"} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", fontSize: "14px" }}>
                                            {["Pending", "In Progress", "Submitted for Review", "Needs Revision", "On Hold", "Completed"].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Remarks</label>
                                <textarea aria-label="Remarks" value={editForm.remarks || ""} onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                                    rows="3" placeholder="Add notes or feedback..."
                                    style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", resize: "none", fontSize: "14px" }} />
                            </div>

                            {(editForm.status === "Completed" || editForm.status === "Submitted for Review") && (
                                <div style={{ marginTop: "16px", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#1e293b", fontWeight: "700" }}>Proof of Completion (Evidence)</h3>
                                    
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>Summary</label>
                                        <input type="text" value={editForm.summary || ""} onChange={e => setEditForm({ ...editForm, summary: e.target.value })} placeholder="Briefly summarize what was completed" style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }} />
                                    </div>

                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>Evidence Type</label>
                                        <select value={editForm.evidence_type || "Attachments"} onChange={e => setEditForm({ ...editForm, evidence_type: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", backgroundColor: "#fff" }}>
                                            <option value="Attachments">Attachments (Files/Images)</option>
                                            <option value="GitHub Repository">GitHub Repository / Code</option>
                                            <option value="Live Demo">Live Demo / URL</option>
                                            <option value="Notes Only">Notes Only</option>
                                        </select>
                                    </div>

                                    {editForm.evidence_type === 'GitHub Repository' && (
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#475569" }}>Repository URL</label>
                                                <input type="url" value={editForm.repository_url || ""} onChange={e => setEditForm({ ...editForm, repository_url: e.target.value })} placeholder="https://github.com/..." style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#475569" }}>Branch Name</label>
                                                <input type="text" value={editForm.branch_name || ""} onChange={e => setEditForm({ ...editForm, branch_name: e.target.value })} placeholder="main" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#475569" }}>Commit Hash(es)</label>
                                                <input type="text" value={editForm.commit_hash || ""} onChange={e => setEditForm({ ...editForm, commit_hash: e.target.value })} placeholder="7a8c9b2, 1f2b3c4" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#475569" }}>Pull Request URL</label>
                                                <input type="url" value={editForm.pull_request_url || ""} onChange={e => setEditForm({ ...editForm, pull_request_url: e.target.value })} placeholder="PR Link" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                                            </div>
                                        </div>
                                    )}

                                    {editForm.evidence_type === 'Live Demo' && (
                                        <div style={{ marginBottom: "16px" }}>
                                            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#475569" }}>Demo URL</label>
                                            <input type="url" value={editForm.demo_url || ""} onChange={e => setEditForm({ ...editForm, demo_url: e.target.value })} placeholder="https://myapp-demo.com" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                                        </div>
                                    )}

                                    {(editForm.evidence_type === 'Attachments' || editForm.evidence_type === 'GitHub Repository' || !editForm.evidence_type) && (
                                        <div style={{ marginBottom: "16px" }}>
                                            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>Upload Files (Screenshots, PDFs, etc.)</label>
                                            <input type="file" multiple onChange={e => setEvidenceFile(Array.from(e.target.files))} style={{ width: "100%", padding: "8px", border: "1px dashed #cbd5e1", borderRadius: "8px", backgroundColor: "#fff" }} />
                                            {evidenceFile.length > 0 && <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{evidenceFile.length} file(s) selected.</p>}
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>Evidence Notes</label>
                                        <textarea value={editForm.notes || ""} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows="2" placeholder="Any specific details, blockers resolved, or notes for the reviewer..." style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", resize: "vertical" }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="submit" disabled={actionLoading} className="btn-save-task"
                                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--primary, #2563eb)", color: "white", border: "none", padding: "13px 28px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px", opacity: actionLoading ? 0.6 : 1 }}>
                                    <FaCheck /> {actionLoading ? "Saving..." : "Save Changes"}
                                </button>
                                <button type="button" onClick={() => setEditing(false)}
                                    style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "13px 24px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Manager Review Widget */}
                {isAdminOrManager && task.submissions?.length > 0 && task.submissions[0].review_status === 'Pending' && (
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", marginBottom: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}><FaCheck color="#10b981" /> Manager Review</h3>
                        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                            <h4 style={{ margin: "0 0 8px 0", color: "#334155" }}>Latest Submission Summary</h4>
                            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>{task.submissions[0].summary}</p>
                        </div>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>Review Comments (Optional)</label>
                            <textarea value={reviewComments} onChange={e => setReviewComments(e.target.value)} rows="3" placeholder="Provide feedback to the employee..." style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", resize: "none", fontSize: "14px" }} />
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => handleManagerReview('Approved')} disabled={actionLoading} style={{ background: "#10b981", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                                Approve & Complete
                            </button>
                            <button onClick={() => handleManagerReview('Rejected')} disabled={actionLoading} style={{ background: "#f59e0b", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                                Request Changes
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Commit Removal Confirmation Modal */}
            {commitToRemove && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#1e293b", fontWeight: "700" }}>Remove Commit</h3>
                        <p style={{ margin: "0 0 24px 0", fontSize: "15px", color: "#475569", lineHeight: "1.5" }}>
                            Are you sure you want to remove commit <strong>{commitToRemove.commitHash.substring(0, 7)}</strong>? This action cannot be undone.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button onClick={() => setCommitToRemove(null)} disabled={actionLoading} style={{ background: "white", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
                                Cancel
                            </button>
                            <button onClick={confirmRemoveCommit} disabled={actionLoading} style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                {actionLoading ? <FaSpinner className="spin" /> : <FaTimes />}
                                Remove Commit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submission Deletion Confirmation Modal */}
            {submissionToDelete && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#1e293b", fontWeight: "700" }}>Delete Submission</h3>
                        <p style={{ margin: "0 0 24px 0", fontSize: "15px", color: "#475569", lineHeight: "1.5" }}>
                            Are you sure you want to delete this entire submission record? This action cannot be undone.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button onClick={() => setSubmissionToDelete(null)} disabled={actionLoading} style={{ background: "white", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
                                Cancel
                            </button>
                            <button onClick={confirmDeleteSubmission} disabled={actionLoading} style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                {actionLoading ? <FaSpinner className="spin" /> : <FaTrashAlt />}
                                Delete Submission
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default TaskDetail;
