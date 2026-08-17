import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaPlus, FaSearch, FaEye, FaFolder, FaFilter, FaUserCircle, FaSort } from "react-icons/fa";
import CreateProjectModal from "./components/CreateProjectModal";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

function Projects() {
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
    const limit = 10;

    const { data: projectsData, mutate: mutateProjects, isLoading } = useSWR(token ? "http://localhost:5000/api/projects" : null, fetcher);
    const { data: deptData } = useSWR(token ? "http://localhost:5000/api/departments" : null, fetcher);
    const { data: empData } = useSWR(token ? "http://localhost:5000/api/employees" : null, fetcher);

    const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
    const departments = Array.isArray(deptData) ? deptData : (deptData?.departments || []);
    const employees = Array.isArray(empData) ? empData : (empData?.employees || []);

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    // Filter
    let filteredProjects = projects.filter(p => {
        const matchesSearch = p.project_name.toLowerCase().includes(search.toLowerCase()) || 
                              (p.project_code && p.project_code.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter ? p.status === statusFilter : true;
        const matchesPriority = priorityFilter ? p.priority === priorityFilter : true;
        const matchesDept = deptFilter ? (String(p.department_id) === String(deptFilter) || p.department_id === parseInt(deptFilter) || getDeptName(p.department_id) === getDeptName(deptFilter)) : true;
        return matchesSearch && matchesStatus && matchesPriority && matchesDept;
    });

    // Sort
    filteredProjects.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(filteredProjects.length / limit) || 1;
    const paginatedProjects = filteredProjects.slice((page - 1) * limit, page * limit);

    const getDeptName = (id) => {
        if (!id) return "Unknown";
        const found = departments.find(d => String(d.id) === String(id) || d.department_name === id || d.id === id || String(d.department_name).toLowerCase() === String(id).toLowerCase());
        return found ? found.department_name : (isNaN(id) ? id : "Unknown");
    };
    const getManagerName = (id) => {
        if (!id) return "Unassigned";
        const m = employees.find(e => String(e.employee_id) === String(id) || e.employee_id === id || `${e.first_name} ${e.last_name}` === id || String(e.id) === String(id));
        return m ? `${m.first_name} ${m.last_name}` : (isNaN(id) ? id : "Unassigned");
    };

    return (
        <DashboardLayout>
            <div className="attendance-page-container" style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
                
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#0f172a", fontWeight: "bold" }}>Projects</h1>
                        <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.95rem" }}>Manage and track all company projects.</p>
                    </div>
                    <button type="button" 
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "10px 20px", backgroundColor: "var(--primary, #4f46e5)", border: "none",
                            borderRadius: "8px", color: "white", fontWeight: "600", cursor: "pointer",
                            boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
                        }}
                    >
                        <FaPlus /> New Project
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", backgroundColor: "white", padding: "16px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <div style={{ position: "relative", flex: "1 1 250px" }}>
                        <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input 
                            type="text" placeholder="Search by name or code..." 
                            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", outline: "none" }}
                        />
                    </div>
                    
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", flex: "1 1 150px" }}>
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Planning">Planning</option>
                    </select>

                    <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", flex: "1 1 150px" }}>
                        <option value="">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", flex: "1 1 180px" }}>
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("project_name")}>Project <FaSort /></th>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("department_id")}>Department <FaSort /></th>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase" }}>Manager</th>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase" }}>Team</th>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("completion_percentage")}>Progress <FaSort /></th>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("status")}>Status <FaSort /></th>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("priority")}>Priority <FaSort /></th>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("end_date")}>Deadline <FaSort /></th>
                                    <th style={{ padding: "16px", color: "#475569", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading projects...</td></tr>
                                ) : paginatedProjects.length === 0 ? (
                                    <tr><td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No projects found matching the criteria.</td></tr>
                                ) : paginatedProjects.map(p => (
                                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background-color 0.2s" }} 
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"} 
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                        onClick={() => navigate(`/admin/projects/${p.id}`)}>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ backgroundColor: p.project_color || "#4f46e5", width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                                    <FaFolder size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" }}>{p.project_name}</div>
                                                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{p.project_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px", color: "#475569", fontSize: "0.9rem" }}>{getDeptName(p.department_id)}</td>
                                        <td style={{ padding: "16px", color: "#475569", fontSize: "0.9rem" }}>{getManagerName(p.manager_id)}</td>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                {/* Mock Team Avatars (since we only have member_count in the list API) */}
                                                <div style={{ display: "flex" }}>
                                                    {[...Array(Math.min(p.member_count || 0, 3))].map((_, i) => (
                                                        <div key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e2e8f0", border: "2px solid white", marginLeft: i > 0 ? "-12px" : "0", display: "flex", justifyContent: "center", alignItems: "center", color: "#94a3b8" }}>
                                                            <FaUserCircle size={20} />
                                                        </div>
                                                    ))}
                                                    {(p.member_count || 0) > 3 && (
                                                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#f1f5f9", border: "2px solid white", marginLeft: "-12px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.75rem", fontWeight: "600", color: "#475569" }}>
                                                            +{p.member_count - 3}
                                                        </div>
                                                    )}
                                                    {(p.member_count === 0 || !p.member_count) && <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No team</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <div style={{ flex: 1, minWidth: "60px", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                                    <div style={{ width: `${p.completion_percentage}%`, height: "100%", backgroundColor: p.completion_percentage === 100 ? "#10b981" : (p.project_color || "#3b82f6") }}></div>
                                                </div>
                                                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", minWidth: "30px" }}>{p.completion_percentage}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <span style={{ 
                                                backgroundColor: p.status === 'Completed' ? '#dcfce7' : p.status === 'Overdue' ? '#fee2e2' : p.status === 'On Hold' ? '#f1f5f9' : '#dbeafe', 
                                                color: p.status === 'Completed' ? '#166534' : p.status === 'Overdue' ? '#991b1b' : p.status === 'On Hold' ? '#475569' : '#1e40af',
                                                padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" 
                                            }}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <span style={{ 
                                                display: "inline-flex", alignItems: "center", gap: "6px",
                                                color: p.priority === 'High' ? '#ef4444' : p.priority === 'Medium' ? '#f59e0b' : '#3b82f6',
                                                fontSize: "0.85rem", fontWeight: "600"
                                            }}>
                                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.priority === 'High' ? '#ef4444' : p.priority === 'Medium' ? '#f59e0b' : '#3b82f6' }} />
                                                {p.priority}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px", color: "#475569", fontSize: "0.9rem" }}>
                                            {new Date(p.end_date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <button 
                                                className="table-action-btn"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/projects/${p.id}`); }} 
                                                title="View Details"
                                            >
                                                <FaEye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredProjects.length)} of {filteredProjects.length} projects
                        </span>
                        <div style={{ display: "flex", gap: "4px" }}>
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))} 
                                disabled={page === 1}
                                style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "white", color: page === 1 ? "#94a3b8" : "#475569", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: "500" }}
                            >
                                Previous
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setPage(i + 1)}
                                    style={{ 
                                        padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", 
                                        backgroundColor: page === i + 1 ? "var(--primary, #4f46e5)" : "white", 
                                        color: page === i + 1 ? "white" : "#475569", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" 
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                                disabled={page === totalPages}
                                style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "white", color: page === totalPages ? "#94a3b8" : "#475569", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: "500" }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <CreateProjectModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    mutateProjects();
                }}
            />
        </DashboardLayout>
    );
}

export default Projects;
