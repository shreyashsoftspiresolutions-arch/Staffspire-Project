import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { FaTimes, FaProjectDiagram } from 'react-icons/fa';

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

export default function EditProjectModal({ isOpen, onClose, onSuccess, project }) {
    const token = localStorage.getItem("token");

    const { data: deptData } = useSWR(isOpen ? "http://localhost:5000/api/departments" : null, fetcher);
    const { data: empData } = useSWR(isOpen ? "http://localhost:5000/api/employees" : null, fetcher);

    const departments = Array.isArray(deptData) ? deptData : (deptData?.departments || []);
    const employees = Array.isArray(empData) ? empData : (empData?.employees || []);

    const [formData, setFormData] = useState({
        project_name: "",
        description: "",
        department_id: "",
        manager_id: "",
        priority: "Medium",
        status: "In Progress",
        start_date: "",
        end_date: "",
        project_color: "#4f46e5",
        repository_provider: "GitHub",
        repository_url: "",
        default_branch: "main"
    });

    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && project) {
            setFormData({
                project_name: project.project_name || "",
                description: project.description || "",
                department_id: project.department_id || "",
                manager_id: project.manager_id || "",
                priority: project.priority || "Medium",
                status: project.status || "In Progress",
                start_date: project.start_date ? project.start_date.split("T")[0] : "",
                end_date: project.end_date ? project.end_date.split("T")[0] : "",
                project_color: project.project_color || "#4f46e5",
                repository_provider: project.repository_provider || "GitHub",
                repository_url: project.repository_url || "",
                default_branch: project.default_branch || "main"
            });
            setError(null);
        }
    }, [isOpen, project]);

    const selectedDeptObj = departments.find(d => String(d.id) === String(formData.department_id) || d.department_name === formData.department_id || String(d.department_name).toLowerCase() === String(formData.department_id).toLowerCase());
    const selectedDeptName = selectedDeptObj ? selectedDeptObj.department_name : "";

    const deptEmployees = employees.filter(e => e.department === selectedDeptName);
    const deptManagers = deptEmployees.filter(e => e.role === "Manager" || e.role === "Admin" || e.designation?.toLowerCase().includes("manager"));
    const availableManagers = formData.department_id
        ? (deptManagers.length > 0 ? deptManagers : deptEmployees)
        : employees.filter(e => e.role === "Manager" || e.role === "Admin" || e.designation?.toLowerCase().includes("manager"));

    const handleDepartmentChange = (e) => {
        const deptId = e.target.value;
        const deptObj = departments.find(d => String(d.id) === String(deptId) || d.department_name === deptId || String(d.department_name).toLowerCase() === String(deptId).toLowerCase());
        const deptName = deptObj ? deptObj.department_name : "";

        let autoManagerId = "";
        if (deptName) {
            const inDept = employees.filter(emp => emp.department === deptName);
            const deptMgr = inDept.find(emp => emp.role === "Manager" || emp.role === "Admin" || emp.designation?.toLowerCase().includes("manager")) || inDept[0];
            if (deptMgr) {
                autoManagerId = deptMgr.employee_id;
            }
        }
        setFormData({ ...formData, department_id: deptId, manager_id: autoManagerId });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.project_name || !formData.department_id || !formData.manager_id || !formData.start_date || !formData.end_date) {
            setError("Please fill in all required fields.");
            return;
        }

        if (formData.repository_url) {
            const urlPattern = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
            if (!urlPattern.test(formData.repository_url)) {
                setError("Please enter a valid repository URL (e.g., https://github.com/company/repo)");
                return;
            }
        }

        try {
            setIsSubmitting(true);
            await axios.put(`http://localhost:5000/api/projects/${project.id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update project. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1000,
            display: "flex", justifyContent: "center", alignItems: "center",
            padding: "20px", backdropFilter: "blur(4px)"
        }}>
            <div style={{
                backgroundColor: "white", borderRadius: "16px",
                width: "100%", maxWidth: "700px", maxHeight: "90vh",
                display: "flex", flexDirection: "column",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}>
                <div style={{
                    padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "40px", height: "40px", borderRadius: "10px",
                            backgroundColor: "#eff6ff", color: "#3b82f6",
                            display: "flex", justifyContent: "center", alignItems: "center",
                            fontSize: "20px"
                        }}>
                            <FaProjectDiagram />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Edit Project Details</h2>
                            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Update project information and classification</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: "none", border: "none", color: "#64748b",
                        cursor: "pointer", padding: "4px", display: "flex",
                        alignItems: "center", justifyContent: "center", borderRadius: "6px"
                    }}>
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                    {error && (
                        <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid #fee2e2" }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Project Name *</label>
                        <input
                            type="text"
                            value={formData.project_name}
                            onChange={e => setFormData({ ...formData, project_name: e.target.value })}
                            placeholder="e.g. Q3 Website Redesign"
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", boxSizing: "border-box" }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Provide a high-level overview of the project objectives..."
                            rows="3"
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", boxSizing: "border-box", resize: "vertical" }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Department *</label>
                            <select value={formData.department_id} onChange={handleDepartmentChange} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required>
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Project Manager *</label>
                            <select value={formData.manager_id} onChange={e => setFormData({ ...formData, manager_id: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required>
                                <option value="">Select Manager</option>
                                {availableManagers.map(m => <option key={m.employee_id} value={m.employee_id}>{m.first_name} {m.last_name} ({m.department || "No Dept"})</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Priority *</label>
                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Status *</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required>
                                <option value="Active">Active</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Start Date *</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>End Date (Deadline) *</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Project Color Theme</label>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            {[
                                { name: 'Indigo', hex: '#4f46e5' },
                                { name: 'Blue', hex: '#3b82f6' },
                                { name: 'Emerald', hex: '#10b981' },
                                { name: 'Amber', hex: '#f59e0b' },
                                { name: 'Rose', hex: '#f43f5e' },
                                { name: 'Purple', hex: '#8b5cf6' }
                            ].map((color) => (
                                <button
                                    key={color.hex}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, project_color: color.hex })}
                                    style={{
                                        width: "36px", height: "36px", borderRadius: "50%",
                                        backgroundColor: color.hex,
                                        border: formData.project_color === color.hex ? "3px solid #0f172a" : "2px solid transparent",
                                        cursor: "pointer",
                                        boxShadow: formData.project_color === color.hex ? "0 0 0 2px white inset" : "none",
                                        transition: "transform 0.1s"
                                    }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "1rem", color: "#1e293b", fontWeight: "600" }}>Development Settings</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Provider</label>
                                <select value={formData.repository_provider} onChange={e => setFormData({...formData, repository_provider: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                    <option value="GitHub">GitHub</option>
                                    <option value="GitLab">GitLab</option>
                                    <option value="Bitbucket">Bitbucket</option>
                                    <option value="Azure DevOps">Azure DevOps</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Repository URL</label>
                                <input type="text" placeholder="https://github.com/company/repo" value={formData.repository_url} onChange={e => setFormData({...formData, repository_url: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Default Branch</label>
                                <input type="text" placeholder="main" value={formData.default_branch} onChange={e => setFormData({...formData, default_branch: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{ padding: "10px 24px", borderRadius: "8px", border: "none", backgroundColor: "var(--primary, #3b82f6)", color: "white", fontWeight: "600", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
