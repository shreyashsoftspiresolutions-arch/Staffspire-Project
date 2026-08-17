import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { FaTimes, FaPlus, FaTrash, FaUserCircle, FaProjectDiagram } from 'react-icons/fa';

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
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
        status: "Active",
        start_date: "",
        end_date: "",
        project_color: "#4f46e5",
        project_icon: "FaFolder",
        repository_provider: "GitHub",
        repository_url: "",
        default_branch: "main"
    });

    const [selectedMembers, setSelectedMembers] = useState([]);
    const [memberSearch, setMemberSearch] = useState("");
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                project_name: "", description: "", department_id: "", manager_id: "",
                priority: "Medium", status: "Active", start_date: "", end_date: "",
                project_color: "#4f46e5", project_icon: "FaFolder",
                repository_provider: "GitHub", repository_url: "", default_branch: "main"
            });
            setSelectedMembers([]);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddMember = (emp) => {
        if (!selectedMembers.find(m => m.employee_id === emp.employee_id)) {
            setSelectedMembers([...selectedMembers, emp]);
        }
        setMemberSearch("");
    };

    const handleRemoveMember = (id) => {
        setSelectedMembers(selectedMembers.filter(m => m.employee_id !== id));
    };

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

    const filteredEmployees = employees.filter(emp => 
        (emp.first_name + " " + emp.last_name).toLowerCase().includes(memberSearch.toLowerCase()) ||
        emp.department?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(memberSearch.toLowerCase())
    ).filter(emp => !selectedMembers.find(m => m.employee_id === emp.employee_id))
     .filter(emp => !formData.department_id || !selectedDeptName || emp.department === selectedDeptName);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.project_name || !formData.department_id || !formData.manager_id || !formData.start_date || !formData.end_date) {
            setError("Please fill all required fields.");
            return;
        }
        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            setError("End date cannot be before start date.");
            return;
        }
        if (formData.repository_url) {
            const urlPattern = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
            if (!urlPattern.test(formData.repository_url)) {
                setError("Please enter a valid repository URL (e.g., https://github.com/company/repo)");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // Create Project
            const projectRes = await axios.post("http://localhost:5000/api/projects", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (projectRes.data.success) {
                const projectId = projectRes.data.projectId;

                // Assign Members (Phase 8)
                for (let member of selectedMembers) {
                    await axios.post("http://localhost:5000/api/projects/members", {
                        project_id: projectId,
                        employee_id: member.employee_id
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(err => console.error("Failed to add member", err));
                }

                onSuccess();
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create project");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000,
            display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
        }}>
            <div style={{
                background: "white", borderRadius: "16px", width: "100%", maxWidth: "800px",
                maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                        <FaProjectDiagram style={{ color: "var(--primary, #4f46e5)" }} /> Create New Project
                    </h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "1.2rem" }}>
                        <FaTimes />
                    </button>
                </div>

                <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                    {error && <div style={{ padding: "12px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px", border: "1px solid #fecaca" }}>{error}</div>}
                    
                    <form id="projectForm" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        
                        {/* Basic Info */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Project Name *</label>
                                <input type="text" value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Project Code</label>
                                <input type="text" value="Auto-generated" disabled style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f1f5f9", color: "#64748b" }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Description</label>
                            <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical" }} />
                        </div>

                        {/* Classification */}
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
                                <select value={formData.manager_id} onChange={e => setFormData({...formData, manager_id: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required>
                                    <option value="">Select Manager</option>
                                    {availableManagers.map(m => <option key={m.employee_id} value={m.employee_id}>{m.first_name} {m.last_name} ({m.department || "No Dept"})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Priority *</label>
                                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Status *</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required>
                                    <option value="Active">Active</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Planning">Planning</option>
                                </select>
                            </div>
                        </div>

                        {/* Timeline & Appearance */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Start Date *</label>
                                <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Deadline *</label>
                                <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} required />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Project Color</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {['var(--primary, #4f46e5)', '#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#0f172a'].map(color => (
                                        <div 
                                            key={color} 
                                            onClick={() => setFormData({...formData, project_color: color})}
                                            style={{
                                                width: "28px", height: "28px", borderRadius: "50%", backgroundColor: color,
                                                cursor: "pointer", border: formData.project_color === color ? "3px solid #cbd5e1" : "2px solid transparent",
                                                boxShadow: formData.project_color === color ? "0 0 0 2px white inset" : "none"
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Development Settings */}
                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", marginTop: "10px" }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "#1e293b" }}>Development Settings</h3>
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

                        {/* Team Members Section (Phase 8) */}
                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", marginTop: "10px" }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "#1e293b" }}>Assign Team Members</h3>
                            
                            <div style={{ position: "relative", marginBottom: "16px" }}>
                                <input 
                                    type="text" 
                                    placeholder="Search employees to assign..." 
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                                {memberSearch && (
                                    <div style={{ 
                                        position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", 
                                        border: "1px solid #cbd5e1", borderRadius: "8px", marginTop: "4px", maxHeight: "200px", 
                                        overflowY: "auto", zIndex: 10, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                                    }}>
                                        {filteredEmployees.length === 0 ? (
                                            <div style={{ padding: "12px", color: "#64748b", textAlign: "center" }}>No matches found</div>
                                        ) : (
                                            filteredEmployees.map(emp => (
                                                <div 
                                                    key={emp.employee_id} 
                                                    onClick={() => handleAddMember(emp)}
                                                    style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b" }}>
                                                            {emp.profile_picture ? <img src={`http://localhost:5000/uploads/${emp.profile_picture}`} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : <FaUserCircle size={20} />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>{emp.first_name} {emp.last_name}</div>
                                                            <div style={{ fontSize: "12px", color: "#64748b" }}>{emp.designation} • {emp.department}</div>
                                                        </div>
                                                    </div>
                                                    <button type="button" style={{ padding: "4px 10px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", color: "#475569", cursor: "pointer" }}>
                                                        Add
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Members Display */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                                {selectedMembers.map(member => (
                                    <div key={member.employee_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b" }}>
                                                {member.profile_picture ? <img src={`http://localhost:5000/uploads/${member.profile_picture}`} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : <FaUserCircle size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>{member.first_name} {member.last_name}</div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>{member.designation}</div>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveMember(member.employee_id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}>
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {selectedMembers.length === 0 && <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>No team members assigned yet.</div>}
                        </div>

                    </form>
                </div>

                <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "#f8fafc" }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 16px", backgroundColor: "white", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#475569", fontWeight: "600", cursor: "pointer" }}>
                        Cancel
                    </button>
                    <button type="submit" form="projectForm" disabled={isSubmitting} style={{ padding: "10px 20px", backgroundColor: "var(--primary, #4f46e5)", border: "none", borderRadius: "8px", color: "white", fontWeight: "600", cursor: isSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                        {isSubmitting ? "Creating..." : <><FaPlus /> Create Project</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
