import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useSWR from "swr";
import axios from "axios";
import DashboardLayout from "../layouts/DashboardLayout";
import { 
    FaArrowLeft, FaCheckCircle, FaTasks, FaExclamationCircle, 
    FaUsers, FaClock, FaFolderOpen, FaProjectDiagram, FaHistory, FaFlag, FaUserCircle, FaPlus, FaTimes, FaEdit, FaTrash, FaUserPlus, FaEye, FaExclamationTriangle, FaFileAlt
} from "react-icons/fa";
import EditProjectModal from "./components/EditProjectModal";
import CustomConfirmModal from "../../components/CustomConfirmModal";
import InlineAlert from "../../components/InlineAlert";
import ProjectTimeline from "./components/ProjectTimeline";
import ProjectReport from "./components/ProjectReport";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const role = user.role || "Employee";
    const isAdminOrManager = role === "Admin" || role === "Manager";

    const [activeTab, setActiveTab] = useState("Overview");

    const { data: projectRes, isLoading, mutate } = useSWR(token ? `http://localhost:5000/api/projects/${id}` : null, fetcher);
    const { data: deptData } = useSWR(token ? "http://localhost:5000/api/departments" : null, fetcher);
    const { data: empData } = useSWR(token ? "http://localhost:5000/api/employees" : null, fetcher);

    const [inlineTask, setInlineTask] = useState(null);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", count: 0, empId: null });

    const handleSaveInlineTask = async () => {
        if (!inlineTask.task_title || !inlineTask.assigned_to || !inlineTask.deadline) {
            setAlertMsg({ type: "warning", text: "Please enter Title, Assignee, and Due Date!" });
            return;
        }
        try {
            setIsSubmittingTask(true);
            await axios.post("http://localhost:5000/api/tasks", { ...inlineTask, project_id: id, department: deptName }, { headers: { Authorization: `Bearer ${token}` } });
            setInlineTask(null);
            mutate();
            setAlertMsg({ type: "success", text: "Task successfully added to project!" });
        } catch (err) {
            setAlertMsg({ type: "error", text: err.response?.data?.message || "Failed to create task." });
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [newMemberId, setNewMemberId] = useState("");

    const handleAddMember = async () => {
        if (!newMemberId) return;
        try {
            await axios.post("http://localhost:5000/api/projects/members", { project_id: id, employee_id: newMemberId }, { headers: { Authorization: `Bearer ${token}` } });
            setNewMemberId("");
            setIsAddMemberOpen(false);
            mutate();
            setAlertMsg({ type: "success", text: "Employee successfully added to project team!" });
        } catch (err) {
            setAlertMsg({ type: "error", text: err.response?.data?.message || "Failed to add team member." });
        }
    };

    const handleRemoveMember = (empId) => {
        setConfirmModal({ isOpen: true, type: "single", count: 1, empId });
    };

    const handleBulkRemoveMembers = () => {
        setConfirmModal({ isOpen: true, type: "bulk", count: selectedMemberIds.length, empId: null });
    };

    const handleConfirmAction = async () => {
        const currentModal = { ...confirmModal };
        setConfirmModal({ isOpen: false, type: "", count: 0, empId: null });

        if (currentModal.type === "single" && currentModal.empId) {
            try {
                await axios.delete(`http://localhost:5000/api/projects/members?project_id=${id}&employee_id=${currentModal.empId}`, { headers: { Authorization: `Bearer ${token}` } });
                setSelectedMemberIds(selectedMemberIds.filter(itemId => itemId !== currentModal.empId));
                mutate();
                setAlertMsg({ type: "success", text: "Team member removed from project." });
            } catch (err) {
                setAlertMsg({ type: "error", text: err.response?.data?.message || "Failed to remove team member." });
            }
        } else if (currentModal.type === "bulk") {
            try {
                for (let empId of selectedMemberIds) {
                    await axios.delete(`http://localhost:5000/api/projects/members?project_id=${id}&employee_id=${empId}`, { headers: { Authorization: `Bearer ${token}` } });
                }
                setSelectedMemberIds([]);
                mutate();
                setAlertMsg({ type: "success", text: "Selected team member(s) removed from project." });
            } catch (err) {
                setAlertMsg({ type: "error", text: "Some removals may have failed. Refreshing list." });
                mutate();
            }
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading Project Details...</div>
            </DashboardLayout>
        );
    }

    if (!projectRes || !projectRes.project) {
        return (
            <DashboardLayout>
                <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>Project not found or an error occurred.</div>
            </DashboardLayout>
        );
    }

    const { project, members = [], tasks = [], milestones = [] } = projectRes;
    const departments = Array.isArray(deptData) ? deptData : (deptData?.departments || []);
    const employees = Array.isArray(empData) ? empData : (empData?.employees || []);

    const deptObj = departments.find(d => String(d.id) === String(project.department_id) || d.department_name === project.department_id || d.id === project.department_id || String(d.department_name).toLowerCase() === String(project.department_id).toLowerCase());
    const deptName = deptObj ? deptObj.department_name : (project.department_id && isNaN(project.department_id) ? project.department_id : "Unknown Department");
    const manager = employees.find(e => String(e.employee_id) === String(project.manager_id) || e.employee_id === project.manager_id || `${e.first_name} ${e.last_name}` === project.manager_id || String(e.id) === String(project.manager_id));
    const managerName = manager ? `${manager.first_name} ${manager.last_name}` : (project.manager_id && isNaN(project.manager_id) ? project.manager_id : "Unassigned");

    const projectEmployees = employees.filter(emp => 
        members.some(m => String(m.employee_id) === String(emp.employee_id)) || 
        String(emp.employee_id) === String(project.manager_id)
    );
    const assignableEmployees = projectEmployees;

    // Widget calculations
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const pendingTasks = tasks.filter(t => t.status !== "Completed").length;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const overdueTasks = tasks.filter(t => new Date(t.deadline) < today && t.status !== "Completed").length;
    
    const endDate = new Date(project.end_date);
    const remainingDays = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
    
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Workload calculation
    const workloadMap = {};
    const getPriorityWeight = (priority) => {
        if (priority === "Critical") return 5;
        if (priority === "High") return 3;
        if (priority === "Low") return 1;
        return 2; // Medium or default
    };
    members.forEach(m => {
        workloadMap[m.employee_id] = {
            name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || `Employee ${m.employee_id}`,
            id: m.employee_id,
            department: m.department || deptName || "—",
            tasksCount: 0,
            completedCount: 0,
            workloadPoints: 0,
            completedPoints: 0,
            priorityBreakdown: { Critical: 0, High: 0, Medium: 0, Low: 0 }
        };
    });
    tasks.forEach(t => {
        if (t.employee_id) {
            if (!workloadMap[t.employee_id]) {
                workloadMap[t.employee_id] = {
                    name: t.employee_name || `Employee ${t.employee_id}`,
                    id: t.employee_id,
                    department: t.department || deptName || "—",
                    tasksCount: 0,
                    completedCount: 0,
                    workloadPoints: 0,
                    completedPoints: 0,
                    priorityBreakdown: { Critical: 0, High: 0, Medium: 0, Low: 0 }
                };
            }
            const weight = getPriorityWeight(t.priority);
            const priKey = t.priority === "Critical" || t.priority === "High" || t.priority === "Low" ? t.priority : "Medium";
            workloadMap[t.employee_id].tasksCount += 1;
            workloadMap[t.employee_id].workloadPoints += weight;
            workloadMap[t.employee_id].priorityBreakdown[priKey] = (workloadMap[t.employee_id].priorityBreakdown[priKey] || 0) + 1;
            if (t.status === "Completed") {
                workloadMap[t.employee_id].completedCount += 1;
                workloadMap[t.employee_id].completedPoints += weight;
            }
        }
    });
    const workloadList = Object.values(workloadMap);

    // Timeline rendering delegated to ProjectTimeline component
    const tabs = ["Overview", "Tasks", "Members", "Workload", "Timeline"];

    return (
        <DashboardLayout>
            <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
                {alertMsg && (
                    <InlineAlert type={alertMsg.type} message={alertMsg.text} onClose={() => setAlertMsg(null)} />
                )}
                {/* Back Button */}
                <div style={{ marginBottom: "20px" }}>
                    <button onClick={() => navigate(isAdminOrManager ? "/admin/projects" : "/employee/projects")} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.95rem", fontWeight: "600" }}>
                        <FaArrowLeft /> Back to Projects
                    </button>
                </div>

                {/* Top Section / Title Card */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "32px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
                        
                        {/* Left Side: Icon and Info */}
                        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
                            {/* Project Icon */}
                            <div style={{ width: "80px", height: "80px", backgroundColor: "#1e293b", borderRadius: "20px", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
                                <FaFolderOpen size={40} />
                            </div>
                            
                            {/* Project Info */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
                                    <h1 style={{ margin: 0, fontSize: "2rem", color: "#0f172a", fontWeight: "700" }}>
                                        {project.project_name} <span style={{ fontSize: "1.7rem", color: "#64748b", fontWeight: "500" }}>({project.project_code})</span>
                                    </h1>
                                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                        <span style={{ padding: "6px 16px", backgroundColor: project.status === 'Completed' ? '#dcfce7' : project.status === 'On Hold' ? '#f1f5f9' : '#e0e7ff', color: project.status === 'Completed' ? '#166534' : project.status === 'On Hold' ? '#475569' : '#3730a3', borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700" }}>
                                            {project.status === 'In Progress' ? 'Active' : project.status}
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: project.priority === 'High' ? '#fee2e2' : project.priority === 'Medium' ? '#fef3c7' : '#dbeafe', color: project.priority === 'High' ? '#991b1b' : project.priority === 'Medium' ? '#92400e' : '#1e40af', padding: "6px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700" }}>
                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: project.priority === 'High' ? '#ef4444' : project.priority === 'Medium' ? '#f59e0b' : '#3b82f6' }} />
                                            {project.priority} Priority
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ display: "flex", gap: "24px", alignItems: "center", color: "#475569", fontSize: "0.95rem" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FaProjectDiagram size={16} /> {deptName}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FaUserCircle size={18} /> Manager: {managerName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Actions and Progress */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: "250px" }}>
                            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                                {(project.status === "Completed" || progress === 100) && (
                                    <button onClick={() => setShowReport(true)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid #e2e8f0", color: "#334155", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "600" }}>
                                        <FaFileAlt /> Report
                                    </button>
                                )}
                                {isAdminOrManager && (
                                    <button onClick={() => setIsEditModalOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#f59e0b", border: "none", color: "white", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem", fontWeight: "600", boxShadow: "0 2px 4px rgba(245, 158, 11, 0.2)" }}>
                                        <FaEdit /> Edit Project Details
                                    </button>
                                )}
                            </div>
                            
                            <div style={{ width: "100%" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>Project Progress</span>
                                    <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b" }}>{progress}%</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginBottom: "8px" }}>
                                    <div style={{ width: `${progress}%`, height: "100%", backgroundColor: progress === 100 ? "#10b981" : "#0f172a", transition: "width 0.5s ease-in-out" }}></div>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#64748b", textAlign: "right", fontWeight: "500" }}>
                                    Deadline: {new Date(project.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Widgets */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                    {[
                        { title: "TOTAL TASKS", value: totalTasks, icon: <FaTasks />, color: "#3b82f6", bg: "#eff6ff" },
                        { title: "COMPLETED", value: completedTasks, icon: <FaCheckCircle />, color: "#10b981", bg: "#ecfdf5" },
                        { title: "PENDING", value: pendingTasks, icon: <FaClock />, color: "#f59e0b", bg: "#fffbeb" },
                        { title: "OVERDUE", value: overdueTasks, icon: <FaExclamationCircle />, color: "#ef4444", bg: "#fef2f2" },
                        { title: "TEAM MEMBERS", value: members.length, icon: <FaUsers />, color: "#8b5cf6", bg: "#f5f3ff" },
                        { title: "REMAINING DAYS", value: remainingDays, icon: <FaFlag />, color: "#06b6d4", bg: "#ecfeff" }
                    ].map((w, i) => (
                        <div key={i} style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: w.bg, color: w.color, display: "flex", justifyContent: "center", alignItems: "center", fontSize: "16px" }}>
                                {w.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "8px" }}>{w.title}</div>
                                <div style={{ fontSize: "2.5rem", color: "#0f172a", fontWeight: "700", lineHeight: "1" }}>{w.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs & Content */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", backgroundColor: "white", padding: "0 24px" }}>
                        {tabs.map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)}
                                style={{ 
                                    padding: "16px 20px", border: "none", background: "none", 
                                    borderBottom: activeTab === tab ? "2px solid #0f172a" : "2px solid transparent",
                                    color: activeTab === tab ? "#0f172a" : "#64748b", fontWeight: activeTab === tab ? "700" : "600", cursor: "pointer", fontSize: "0.95rem",
                                    transition: "all 0.2s"
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div style={{ padding: "32px 24px" }}>
                        {/* Tab Content Rendering */}
                        
                        {activeTab === "Overview" && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "48px" }}>
                                {/* Left Column: Description, Key Details, Manager */}
                                <div style={{ flex: "2", minWidth: "350px" }}>
                                    <h3 style={{ marginTop: 0, color: "#1e293b", fontSize: "1.3rem", fontWeight: "600", marginBottom: "16px" }}>Project Description</h3>
                                    <p style={{ color: "#475569", lineHeight: "1.7", fontSize: "1rem", marginBottom: "40px" }}>{project.description || "No description provided."}</p>
                                    
                                    <div style={{ display: "flex", gap: "64px", flexWrap: "wrap" }}>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "12px", textTransform: "uppercase" }}>Key Details</div>
                                            
                                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "4px", textTransform: "uppercase" }}>Start Date</div>
                                            <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: "500", marginBottom: "16px" }}>{new Date(project.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                            
                                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "4px", textTransform: "uppercase" }}>Deadline</div>
                                            <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: "500", marginBottom: "16px" }}>{new Date(project.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                            
                                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "4px", textTransform: "uppercase" }}>Department</div>
                                            <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: "500" }}>{deptName}</div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em", marginBottom: "12px", textTransform: "uppercase" }}>Manager</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", minWidth: "280px" }}>
                                                <img src={manager?.profile_picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(managerName) + "&background=0D8ABC&color=fff"} alt="Manager Avatar" style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "0.9rem" }}>{managerName}</div>
                                                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{manager?.email || "No email available"}</div>
                                                </div>
                                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #cbd5e1", display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b", cursor: "pointer", backgroundColor: "white" }}>
                                                    ✉️
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Repository */}
                                <div style={{ flex: "1", minWidth: "300px" }}>
                                    <h3 style={{ marginTop: 0, color: "#1e293b", fontSize: "1.3rem", fontWeight: "600", marginBottom: "16px" }}>Repository</h3>
                                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                                            <div style={{ width: "48px", height: "48px", backgroundColor: "#0f172a", color: "white", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" }}>
                                                {/* Fallback to simple GitHub text icon style */}
                                                <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" data-view-component="true" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>Provider</div>
                                                <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "1.05rem" }}>{project.repository_provider || "GitHub"}</div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ marginBottom: "24px" }}>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>Default Branch</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#e2e8f0", padding: "10px 16px", borderRadius: "8px", fontFamily: "monospace", color: "#334155", fontSize: "0.95rem" }}>
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"></path></svg>
                                                {project.default_branch || "main"}
                                            </div>
                                        </div>

                                        <a 
                                            href={project.repository_url || "#"} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", backgroundColor: "#f59e0b", color: "white", padding: "12px", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "600", textDecoration: "none", width: "100%", boxSizing: "border-box", boxShadow: "0 2px 4px rgba(245, 158, 11, 0.25)" }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                            Open Repository
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "Tasks" && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.3rem" }}>Project Tasks</h3>
                                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>Manage tasks inline like a spreadsheet. Click "+ Add Row" at the bottom to insert new tasks.</p>
                                    </div>
                                    <button 
                                        onClick={() => setInlineTask({ task_title: "", description: "", status: "Pending", start_date: new Date().toLocaleDateString('en-CA'), deadline: "", assigned_to: "", priority: "Medium" })}
                                        className="primary-btn"
                                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", backgroundColor: "var(--primary, #4f46e5)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)" }}
                                    >
                                        <FaPlus /> Add Row
                                    </button>
                                </div>
                                <div style={{ overflowX: "auto", border: "1px solid #cbd5e1", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "2px solid #cbd5e1", backgroundColor: "#f8fafc", textAlign: "left" }}>
                                                <th style={{ padding: "14px 12px", width: "70px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Sr. No.</th>
                                                <th style={{ padding: "14px 12px", minWidth: "180px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Title</th>
                                                <th style={{ padding: "14px 12px", minWidth: "200px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Description</th>
                                                <th style={{ padding: "14px 12px", width: "130px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Status</th>
                                                <th style={{ padding: "14px 12px", width: "110px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Priority</th>
                                                <th style={{ padding: "14px 12px", width: "130px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Start Date</th>
                                                <th style={{ padding: "14px 12px", width: "130px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Due Date</th>
                                                <th style={{ padding: "14px 12px", minWidth: "160px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Assigned To</th>
                                                <th style={{ padding: "14px 12px", width: "100px", textAlign: "center", color: "#334155", fontWeight: "700", fontSize: "0.85rem" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((t, idx) => (
                                                <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: idx % 2 === 0 ? "white" : "#fcfcfd" }}>
                                                    <td style={{ padding: "12px", color: "#64748b", fontWeight: "600", borderRight: "1px solid #e2e8f0", fontSize: "0.9rem" }}>{idx + 1}</td>
                                                    <td style={{ padding: "12px", fontWeight: "600", color: "#0f172a", borderRight: "1px solid #e2e8f0", fontSize: "0.9rem" }}>{t.task_title}</td>
                                                    <td style={{ padding: "12px", color: "#475569", borderRight: "1px solid #e2e8f0", fontSize: "0.85rem" }}>{t.description || "—"}</td>
                                                    <td style={{ padding: "12px", borderRight: "1px solid #e2e8f0" }}>
                                                        <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "600", backgroundColor: t.status === "Completed" ? "#dcfce7" : t.status === "In Progress" ? "#dbeafe" : t.status === "On Hold" ? "#f3f4f6" : "#fef9c3", color: t.status === "Completed" ? "#166534" : t.status === "In Progress" ? "#1e40af" : t.status === "On Hold" ? "#374151" : "#854d0e" }}>{t.status}</span>
                                                    </td>
                                                    <td style={{ padding: "12px", borderRight: "1px solid #e2e8f0" }}>
                                                        <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "700", backgroundColor: t.priority === "High" ? "#fee2e2" : t.priority === "Low" ? "#f1f5f9" : "#ffedd5", color: t.priority === "High" ? "#b91c1c" : t.priority === "Low" ? "#475569" : "#c2410c" }}>{t.priority || "Medium"}</span>
                                                    </td>
                                                    <td style={{ padding: "12px", color: "#475569", borderRight: "1px solid #e2e8f0", fontSize: "0.85rem" }}>{t.start_date ? new Date(t.start_date).toLocaleDateString() : "—"}</td>
                                                    <td style={{ padding: "12px", color: "#475569", borderRight: "1px solid #e2e8f0", fontSize: "0.85rem" }}>{t.deadline ? new Date(t.deadline).toLocaleDateString() : "—"}</td>
                                                    <td style={{ padding: "12px", color: "#334155", borderRight: "1px solid #e2e8f0", fontSize: "0.9rem", fontWeight: "500" }}>{t.employee_name || "Unassigned"}</td>
                                                    <td style={{ padding: "12px", textAlign: "center" }}>
                                                        <button 
                                                            onClick={() => navigate(isAdminOrManager ? `/admin/tasks/${t.id}` : `/employee/tasks/${t.id}`)} 
                                                            style={{ background: "none", border: "none", color: "var(--primary, #3b82f6)", cursor: "pointer", display: "inline-flex", alignItems: "center", padding: "6px", borderRadius: "6px", transition: "all 0.2s" }}
                                                            onMouseOver={e => e.currentTarget.style.backgroundColor = "#eff6ff"}
                                                            onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}
                                                            title="View Task Details"
                                                        >
                                                            <FaEye size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {inlineTask ? (
                                                <tr style={{ backgroundColor: "#eff6ff", borderBottom: "2px solid #3b82f6" }}>
                                                    <td style={{ padding: "10px 12px", fontWeight: "700", color: "#1e3a8a", borderRight: "1px solid #bfdbfe" }}>{tasks.length + 1}</td>
                                                    <td style={{ padding: "8px", borderRight: "1px solid #bfdbfe" }}>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Task Title *" 
                                                            value={inlineTask.task_title} 
                                                            onChange={e => setInlineTask({ ...inlineTask, task_title: e.target.value })}
                                                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #60a5fa", borderRadius: "6px", fontSize: "0.9rem", boxSizing: "border-box", outline: "none", backgroundColor: "white" }}
                                                            autoFocus
                                                        />
                                                    </td>
                                                    <td style={{ padding: "8px", borderRight: "1px solid #bfdbfe" }}>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Description..." 
                                                            value={inlineTask.description} 
                                                            onChange={e => setInlineTask({ ...inlineTask, description: e.target.value })}
                                                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", backgroundColor: "white" }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "8px", borderRight: "1px solid #bfdbfe" }}>
                                                        <select 
                                                            value={inlineTask.status} 
                                                            onChange={e => setInlineTask({ ...inlineTask, status: e.target.value })}
                                                            style={{ width: "100%", padding: "8px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", backgroundColor: "white", fontWeight: "600" }}
                                                        >
                                                            <option>Pending</option>
                                                            <option>In Progress</option>
                                                            <option>On Hold</option>
                                                            <option>Completed</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: "8px", borderRight: "1px solid #bfdbfe" }}>
                                                        <select 
                                                            value={inlineTask.priority || "Medium"} 
                                                            onChange={e => setInlineTask({ ...inlineTask, priority: e.target.value })}
                                                            style={{ width: "100%", padding: "8px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", backgroundColor: "white", fontWeight: "600" }}
                                                        >
                                                            <option value="Critical">Critical</option>
                                                            <option value="High">High</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="Low">Low</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: "8px", borderRight: "1px solid #bfdbfe" }}>
                                                        <input 
                                                            type="date" 
                                                            value={inlineTask.start_date} 
                                                            onChange={e => setInlineTask({ ...inlineTask, start_date: e.target.value })}
                                                            style={{ width: "100%", padding: "8px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", backgroundColor: "white" }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "8px", borderRight: "1px solid #bfdbfe" }}>
                                                        <input 
                                                            type="date" 
                                                            value={inlineTask.deadline} 
                                                            onChange={e => setInlineTask({ ...inlineTask, deadline: e.target.value })}
                                                            style={{ width: "100%", padding: "8px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", backgroundColor: "white" }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "8px", borderRight: "1px solid #bfdbfe" }}>
                                                        <select 
                                                            value={inlineTask.assigned_to} 
                                                            onChange={e => setInlineTask({ ...inlineTask, assigned_to: e.target.value })}
                                                            style={{ width: "100%", padding: "8px", border: "1px solid #60a5fa", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", backgroundColor: "white" }}
                                                        >
                                                            <option value="">Select Employee *</option>
                                                            {assignableEmployees.map(emp => (
                                                                <option key={emp.employee_id} value={emp.employee_id}>
                                                                    {emp.first_name} {emp.last_name} ({emp.department || "No Dept"})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: "8px", textAlign: "center", whiteSpace: "nowrap" }}>
                                                        <button 
                                                            type="button"
                                                            onClick={handleSaveInlineTask} 
                                                            disabled={isSubmittingTask}
                                                            style={{ backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", padding: "8px 12px", cursor: "pointer", fontWeight: "600", marginRight: "6px", fontSize: "0.85rem" }}
                                                            title="Save Row"
                                                        >
                                                            {isSubmittingTask ? "..." : "Save"}
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setInlineTask(null)}
                                                            style={{ backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", padding: "8px 10px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" }}
                                                            title="Cancel"
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ) : isAdminOrManager ? (
                                                <tr>
                                                    <td colSpan={9} style={{ padding: "14px", textAlign: "left", backgroundColor: "#f8fafc" }}>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setInlineTask({ task_title: "", description: "", status: "Pending", start_date: new Date().toLocaleDateString('en-CA'), deadline: "", assigned_to: "", priority: "Medium" })}
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "none", border: "1px dashed #94a3b8", color: "#475569", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem", padding: "8px 16px", borderRadius: "8px", width: "100%", justifyContent: "center", transition: "all 0.2s" }}
                                                            onMouseOver={e => { e.currentTarget.style.backgroundColor = "#eff6ff"; e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#2563eb"; }}
                                                            onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#475569"; }}
                                                        >
                                                            <FaPlus /> + Add New Task Row
                                                        </button>
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "Members" && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <h3 style={{ margin: 0, color: "#1e293b" }}>Project Team ({members.length})</h3>
                                        {isAdminOrManager && selectedMemberIds.length > 0 && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", padding: "6px 14px", borderRadius: "8px" }}>
                                                <span style={{ fontSize: "0.85rem", color: "#b91c1c", fontWeight: "600" }}>{selectedMemberIds.length} Selected</span>
                                                <button onClick={handleBulkRemoveMembers} style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <FaTrash /> Remove Selected
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        {isAdminOrManager && (!isAddMemberOpen ? (
                                            <button onClick={() => setIsAddMemberOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "var(--primary, #3b82f6)", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 2px 4px rgba(59, 130, 246, 0.15)" }}>
                                                <FaUserPlus /> + Add Employee to Project
                                            </button>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                                <select value={newMemberId} onChange={e => setNewMemberId(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", minWidth: "220px", outline: "none" }}>
                                                    <option value="">Select employee to add...</option>
                                                    {employees.filter(emp => !members.some(m => m.employee_id === emp.employee_id)).map(emp => (
                                                        <option key={emp.employee_id} value={emp.employee_id}>
                                                            {emp.first_name} {emp.last_name} ({emp.department || "No Dept"})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button onClick={handleAddMember} disabled={!newMemberId} style={{ backgroundColor: "#10b981", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", fontWeight: "600", fontSize: "0.85rem", cursor: !newMemberId ? "not-allowed" : "pointer", opacity: !newMemberId ? 0.6 : 1 }}>
                                                    Add
                                                </button>
                                                <button onClick={() => { setIsAddMemberOpen(false); setNewMemberId(""); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {members.length === 0 ? (
                                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                                        No members added to this project yet.
                                    </div>
                                ) : (
                                    <div style={{ overflowX: "auto", border: "1px solid #cbd5e1", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "2px solid #cbd5e1", backgroundColor: "#f8fafc", textAlign: "left" }}>
                                                    {isAdminOrManager && (
                                                        <th style={{ padding: "14px 12px", width: "50px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={members.length > 0 && selectedMemberIds.length === members.length}
                                                                onChange={e => handleSelectAllMembers(e.target.checked)}
                                                                style={{ cursor: "pointer" }}
                                                            />
                                                        </th>
                                                    )}
                                                    <th style={{ padding: "14px 12px", width: "60px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Sr.</th>
                                                    <th style={{ padding: "14px 12px", minWidth: "200px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Employee Name</th>
                                                    <th style={{ padding: "14px 12px", minWidth: "160px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Department</th>
                                                    <th style={{ padding: "14px 12px", minWidth: "160px", color: "#334155", fontWeight: "700", fontSize: "0.85rem", borderRight: "1px solid #e2e8f0" }}>Designation</th>
                                                    <th style={{ padding: "14px 12px", width: "140px", color: "#334155", fontWeight: "700", fontSize: "0.85rem" }}>Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {members.map((m, idx) => {
                                                    const isSelected = selectedMemberIds.includes(m.employee_id);
                                                    const isManager = String(m.employee_id) === String(project.manager_id);
                                                    return (
                                                        <tr key={m.id || m.employee_id} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: idx % 2 === 0 ? "white" : "#fcfcfd" }}>
                                                            {isAdminOrManager && (
                                                                <td style={{ padding: "12px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isSelected}
                                                                        onChange={e => {
                                                                            if (e.target.checked) setSelectedMemberIds([...selectedMemberIds, m.employee_id]);
                                                                            else setSelectedMemberIds(selectedMemberIds.filter(id => id !== m.employee_id));
                                                                        }}
                                                                        style={{ cursor: "pointer" }}
                                                                    />
                                                                </td>
                                                            )}
                                                            <td style={{ padding: "12px", color: "#64748b", fontWeight: "600", borderRight: "1px solid #e2e8f0", fontSize: "0.9rem" }}>{idx + 1}</td>
                                                            <td style={{ padding: "12px", fontWeight: "600", color: "#0f172a", borderRight: "1px solid #e2e8f0", fontSize: "0.9rem" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                    <FaUserCircle size={24} color="#94a3b8" />
                                                                    <span>{m.first_name} {m.last_name}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: "12px", color: "#475569", borderRight: "1px solid #e2e8f0", fontSize: "0.85rem" }}>{m.department || "—"}</td>
                                                            <td style={{ padding: "12px", color: "#475569", borderRight: "1px solid #e2e8f0", fontSize: "0.85rem" }}>{m.designation || "—"}</td>
                                                            <td style={{ padding: "12px", fontSize: "0.85rem" }}>
                                                                <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700", backgroundColor: isManager ? "#fef3c7" : "#f1f5f9", color: isManager ? "#92400e" : "#475569" }}>
                                                                    {isManager ? "Project Manager" : "Team Member"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Workload" && (
                            <div>
                                <div style={{ marginBottom: "20px" }}>
                                    <h3 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.3rem" }}>Team Workload & Task Distribution</h3>
                                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>Monitor individual capacity, active task distribution, and identify overloaded team members.</p>
                                </div>
                                {workloadList.length === 0 ? (
                                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                                        No team members or tasks found for workload analysis.
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                                        {workloadList.map(emp => {
                                            const activeCount = emp.tasksCount - emp.completedCount;
                                            const activePoints = emp.workloadPoints - emp.completedPoints;
                                            const isOverloaded = emp.workloadPoints >= 10 || emp.tasksCount >= 5;
                                            const blockBar = "█".repeat(Math.min(emp.workloadPoints, 20)) || "—";
                                            const compPct = emp.workloadPoints > 0 ? Math.round((emp.completedPoints / emp.workloadPoints) * 100) : 0;
                                            
                                            return (
                                                <div key={emp.id} style={{ backgroundColor: "white", border: isOverloaded ? "2px solid #f87171" : "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", position: "relative", transition: "all 0.2s" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <FaUserCircle size={36} color={isOverloaded ? "#ef4444" : "#64748b"} />
                                                            <div>
                                                                <h4 style={{ margin: "0 0 2px 0", color: "#0f172a", fontSize: "1.05rem" }}>{emp.name}</h4>
                                                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{emp.department}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: "right" }}>
                                                            <span style={{ backgroundColor: isOverloaded ? "#fee2e2" : "#eff6ff", color: isOverloaded ? "#dc2626" : "#2563eb", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700", display: "inline-block", marginBottom: "4px" }}>
                                                                {emp.workloadPoints} Workload Pts
                                                            </span>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
                                                                {emp.tasksCount} Task{emp.tasksCount !== 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                                                        {emp.priorityBreakdown?.Critical > 0 && (
                                                            <span style={{ fontSize: "0.75rem", background: "#fef2f2", color: "#991b1b", padding: "2px 8px", borderRadius: "6px", border: "1px solid #fca5a5", fontWeight: "600" }}>
                                                                Critical: {emp.priorityBreakdown.Critical} (x5)
                                                            </span>
                                                        )}
                                                        {emp.priorityBreakdown?.High > 0 && (
                                                            <span style={{ fontSize: "0.75rem", background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "6px", border: "1px solid #fecaca", fontWeight: "600" }}>
                                                                High: {emp.priorityBreakdown.High} (x3)
                                                            </span>
                                                        )}
                                                        {emp.priorityBreakdown?.Medium > 0 && (
                                                            <span style={{ fontSize: "0.75rem", background: "#ffedd5", color: "#c2410c", padding: "2px 8px", borderRadius: "6px", border: "1px solid #fed7aa", fontWeight: "600" }}>
                                                                Medium: {emp.priorityBreakdown.Medium} (x2)
                                                            </span>
                                                        )}
                                                        {emp.priorityBreakdown?.Low > 0 && (
                                                            <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", fontWeight: "600" }}>
                                                                Low: {emp.priorityBreakdown.Low} (x1)
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={{ marginBottom: "16px", backgroundColor: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                                                            <span>Workload Bar (by points)</span>
                                                            <span style={{ fontWeight: "600", color: "#334155" }}>{compPct}% Completed</span>
                                                        </div>
                                                        <div style={{ fontFamily: "monospace", color: isOverloaded ? "#dc2626" : "var(--primary, #4f46e5)", fontSize: "1rem", letterSpacing: "1px", wordBreak: "break-all" }}>
                                                            {blockBar}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px", fontSize: "0.85rem" }}>
                                                        <span style={{ color: "#16a34a", fontWeight: "600" }}>✓ {emp.completedPoints} pts Done ({emp.completedCount})</span>
                                                        <span style={{ color: "#d97706", fontWeight: "600" }}>⏳ {activePoints} pts Active ({activeCount})</span>
                                                    </div>

                                                    {isOverloaded && (
                                                        <div style={{ marginTop: "14px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                                                            <FaExclamationTriangle color="#ef4444" /> Employee Overloaded
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Timeline" && (
                            <ProjectTimeline 
                                project={project} 
                                deptName={deptName} 
                                members={members} 
                                tasks={tasks} 
                                milestones={milestones} 
                                progress={progress} 
                            />
                        )}
                    </div>
                </div>

                {isAdminOrManager && (
                    <EditProjectModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSuccess={() => mutate()}
                        project={project}
                    />
                )}

                <CustomConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, type: "", count: 0, empId: null })}
                    onConfirm={handleConfirmAction}
                    title="Confirm Removal"
                    message={confirmModal.type === "bulk" ? `Are you sure you want to remove ${confirmModal.count} selected employee(s) from this project?` : "Are you sure you want to remove this employee from the project?"}
                    confirmText="Remove"
                    cancelText="Cancel"
                    type="danger"
                />

                <ProjectReport
                    isOpen={showReport}
                    onClose={() => setShowReport(false)}
                    project={project}
                    members={members}
                    tasks={tasks}
                    milestones={milestones}
                    deptName={deptName}
                    managerName={managerName}
                    progress={progress}
                    workloadList={workloadList}
                />
            </div>

        </DashboardLayout>
    );
}
