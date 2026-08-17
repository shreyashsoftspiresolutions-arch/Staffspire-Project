import { useEffect, useState } from "react";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { FaBuilding, FaUsers, FaEdit, FaTrash, FaCheck, FaTimes, FaUserTie, FaBriefcase, FaIdBadge, FaEye } from "react-icons/fa";
import CustomConfirmModal from "../../components/CustomConfirmModal";
import InlineAlert from "../../components/InlineAlert";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);


function DepartmentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [editing, setEditing] = useState(false);
    const [dept, setDept] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [manager, setManager] = useState(null);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [alertType, setAlertType] = useState("error");

    const showAlert = (msg, type = "error") => {
        setAlertMsg(msg);
        setAlertType(type);
        setTimeout(() => setAlertMsg(""), 6000);
    };


    const { data: deptData, mutate: fetchDepartmentDetails } = useSWR(`http://localhost:5000/api/departments/${id}`, fetcher);

    useEffect(() => {
        if (deptData && deptData.success) {
            setDept(deptData.department);
            setNewName(deptData.department.department_name);
            setEmployees(deptData.employees || []);
            setManager(deptData.manager || null);
        }
    }, [deptData]);

    const handleUpdate = async () => {
        if (!newName.trim()) {
            showAlert("Department name is required.", "warning");
            return;
        }
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/departments/${id}`,
                { department_name: newName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showAlert("Department updated successfully!", "success");
            setEditing(false);
            fetchDepartmentDetails();
        } catch (error) {
            console.log(error);
            showAlert(error.response?.data?.message || "Failed to update department.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => setIsDeleteModalOpen(true);

    const handleConfirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `http://localhost:5000/api/departments/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate("/admin/departments");
        } catch (error) {
            console.log(error);
            showAlert(error.response?.data?.message || "Failed to delete department.", "error");
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    if (!dept) {
        return (
            <DashboardLayout>
                <div style={{ textAlign: "center", padding: "100px" }}>
                    <p style={{ fontSize: "18px", color: "#64748b" }}>Loading department profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    const activeCount = employees.filter(e => e.status === "Active" || !e.status).length;

    return (
        <DashboardLayout>
            {/* Page header */}
            <div className="employee-header" style={{ marginBottom: "20px" }}>
                <h1 className="page-title" style={{ margin: 0 }}>Department Profile</h1>
                <button type="button"
                    className="action-btn-custom action-btn-secondary"
                    onClick={() => navigate("/admin/departments")}
                >
                    ← Back to List
                </button>
            </div>

            {/* Inline Alert */}
            {alertMsg && (
                <InlineAlert
                    type={alertType}
                    message={alertMsg}
                    onClose={() => setAlertMsg("")}
                />
            )}

            <div className="profile-details-grid">
                {/* ── Left card: Summary ── */}
                <div className="details-card">
                    <div
                        className="details-card-avatar"
                        style={{ margin: "0 auto", background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", color: "#4f46e5" }}
                    >
                        <FaBuilding />
                    </div>
                    <h2 className="details-card-name">{dept.department_name}</h2>
                    <span className="details-card-role">Department</span>

                    <div className="details-card-divider"></div>

                    <div className="details-card-info-item">
                        <span className="details-card-info-label">Department ID</span>
                        <span className="details-card-info-value">#{dept.id}</span>
                    </div>

                    <div className="details-card-info-item">
                        <span className="details-card-info-label">Total Employees</span>
                        <span className="details-card-info-value" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaUsers style={{ color: "#4f46e5" }} /> {employees.length}
                        </span>
                    </div>

                    <div className="details-card-info-item">
                        <span className="details-card-info-label">Active</span>
                        <span className="details-card-info-value" style={{ color: "#16a34a", fontWeight: 700 }}>
                            {activeCount}
                        </span>
                    </div>

                    {manager && (
                        <div className="details-card-info-item">
                            <span className="details-card-info-label">Manager</span>
                            <span className="details-card-info-value">
                                {manager.first_name} {manager.last_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Right card: Info / Edit ── */}
                <div className="info-card">
                    <h3 className="info-card-title">
                        {editing ? "✏️ Edit Department" : "📋 Department Information"}
                    </h3>

                    {editing ? (
                        /* Edit form */
                        <div style={{ marginTop: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
                                <label style={{
                                    fontSize: "12px", fontWeight: 700, color: "#64748b",
                                    textTransform: "uppercase", letterSpacing: "0.05em"
                                }}>
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    aria-label="Department Name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: "100%", padding: "11px 14px",
                                        border: "1px solid #e2e8f0", borderRadius: "8px",
                                        fontSize: "14px", background: "#f8fafc",
                                        color: "#1e293b", boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    type="button"
                                    className="action-btn-custom action-btn-secondary"
                                    onClick={() => { setEditing(false); setNewName(dept.department_name); }}
                                    disabled={isSaving}
                                >
                                    <FaTimes /> Cancel
                                </button>
                                <button
                                    type="button"
                                    className="action-btn-custom action-btn-primary"
                                    onClick={handleUpdate}
                                    disabled={isSaving}
                                >
                                    <FaCheck /> {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* View mode */
                        <div>
                            {/* Info rows */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                                <div className="details-info-row">
                                    <span className="details-info-label"><FaIdBadge style={{ marginRight: 8 }} />Department ID</span>
                                    <span className="details-info-value">#{dept.id}</span>
                                </div>
                                <div className="details-info-row">
                                    <span className="details-info-label"><FaBuilding style={{ marginRight: 8 }} />Department Name</span>
                                    <span className="details-info-value">{dept.department_name}</span>
                                </div>
                                <div className="details-info-row">
                                    <span className="details-info-label"><FaUsers style={{ marginRight: 8 }} />Total Employees</span>
                                    <span className="details-info-value">{employees.length}</span>
                                </div>
                                <div className="details-info-row">
                                    <span className="details-info-label"><FaUserTie style={{ marginRight: 8 }} />Manager</span>
                                    <span className="details-info-value">
                                        {manager ? `${manager.first_name} ${manager.last_name}` : "— Unassigned"}
                                    </span>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="actions-container" style={{ marginTop: "24px" }}>
                                <button type="button"
                                    className="action-btn-custom action-btn-danger"
                                    onClick={handleDeleteClick}
                                >
                                    <FaTrash /> Delete Department
                                </button>
                                <button type="button"
                                    className="action-btn-custom action-btn-primary"
                                    onClick={() => setEditing(true)}
                                >
                                    <FaEdit /> Edit Department
                                </button>
                            </div>

                            {/* ── Employee Roster ── */}
                            {employees.length > 0 && (
                                <div style={{ marginTop: "32px" }}>
                                    <h4 style={{
                                        fontSize: "13px", fontWeight: 700, color: "#64748b",
                                        textTransform: "uppercase", letterSpacing: "0.07em",
                                        marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px"
                                    }}>
                                        <FaUsers style={{ color: "#4f46e5" }} />
                                        Employees ({employees.length})
                                    </h4>
                                    <div style={{
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "10px",
                                        overflow: "hidden"
                                    }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                                            <thead>
                                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Employee</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Designation</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Type</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#475569" }}>Status</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#475569" }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employees.map((emp, idx) => (
                                                    <tr
                                                        key={emp.id}
                                                        style={{
                                                            borderBottom: idx < employees.length - 1 ? "1px solid #f1f5f9" : "none",
                                                            transition: "background 0.15s"
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        <td style={{ padding: "10px 14px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                <div style={{
                                                                    width: "30px", height: "30px", borderRadius: "50%",
                                                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                                    color: "#fff", display: "flex", alignItems: "center",
                                                                    justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0
                                                                }}>
                                                                    {(emp.first_name?.[0] || "") + (emp.last_name?.[0] || "")}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                                                                        {emp.first_name} {emp.last_name}
                                                                    </div>
                                                                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                                                        {emp.employee_id || `#${emp.id}`}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "10px 14px", color: "#475569" }}>
                                                            {emp.designation || "—"}
                                                        </td>
                                                        <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "12px" }}>
                                                            {emp.employment_type || "—"}
                                                        </td>
                                                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                                            <span style={{
                                                                padding: "2px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700,
                                                                background: (emp.status === "Active" || !emp.status) ? "#dcfce7" : "#fee2e2",
                                                                color: (emp.status === "Active" || !emp.status) ? "#166534" : "#991b1b"
                                                            }}>
                                                                {emp.status || "Active"}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                                            <button type="button"
                                                                className="table-action-btn"
                                                                title="View Employee"
                                                                aria-label="View Employee"
                                                                onClick={() => navigate(`/admin/employees/${emp.id}`)}
                                                            >
                                                                <FaEye />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {employees.length === 0 && (
                                <div style={{
                                    marginTop: "24px", padding: "32px",
                                    textAlign: "center", border: "1.5px dashed #e2e8f0",
                                    borderRadius: "10px", color: "#94a3b8"
                                }}>
                                    <FaUsers style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontSize: "14px" }}>No employees assigned to this department yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <CustomConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the department '${dept?.department_name}'? This action cannot be undone.`}
                confirmText="Delete Anyway"
                cancelText="Cancel"
                type="danger"
            />
        </DashboardLayout>
    );
}

export default DepartmentDetails;
