import { useEffect, useState } from "react";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaBuilding, FaIdBadge, FaEdit, FaTrash, FaCheck, FaTimes, FaLock, FaKey, FaPhone, FaVenusMars, FaMoneyBillAlt, FaBriefcase, FaCalendarAlt } from "react-icons/fa";
import CustomConfirmModal from "../../components/CustomConfirmModal";
import InlineAlert from "../../components/InlineAlert";

const fetcherAuth = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);
const fetcher = (url) => axios.get(url).then(res => res.data);


function EmployeeDetails() {
    const { id } = useParams();
    const [editing, setEditing] = useState(false);
    const [employee, setEmployee] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState("");
    const [revealedPassword, setRevealedPassword] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [alertType, setAlertType] = useState("error");
    const [isSaving, setIsSaving] = useState(false);
    const [pwPromptAlert, setPwPromptAlert] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [showTaskTransferModal, setShowTaskTransferModal] = useState(false);
    const [taskTransferData, setTaskTransferData] = useState(null);
    const [taskAction, setTaskAction] = useState("keep");
    const [reassignTo, setReassignTo] = useState("");
    const [departmentEmployees, setDepartmentEmployees] = useState([]);
    const navigate = useNavigate();

    const loggedInUser = JSON.parse(localStorage.getItem("user:v1")) || {};
    const isAdmin = loggedInUser.role === "Admin";
    const isManager = loggedInUser.role === "Manager";

    const showAlert = (msg, type = "error") => {
        setAlertMsg(msg);
        setAlertType(type);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setAlertMsg(""), 6000);
    };




    const { data: empData, mutate: fetchEmployee } = useSWR(`http://localhost:5000/api/employees/${id}`, fetcherAuth);
    const { data: deptData } = useSWR("http://localhost:5000/api/departments", fetcher);

    useEffect(() => {
        if (empData && empData.employee) {
            setEmployee(empData.employee);
        }
    }, [empData]);

    useEffect(() => {
        if (deptData) {
            setDepartments(deptData);
        }
    }, [deptData]);

    const handleVerifyAdminPassword = async () => {
        if (!adminPasswordInput) {
            setPwPromptAlert("Admin password is required");
            return;
        }
        if (isVerifying) return;
        setPwPromptAlert("");
        setIsVerifying(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:5000/api/employees/${id}/reveal-password`,
                { adminPassword: adminPasswordInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setRevealedPassword(response.data.password);
                setShowPasswordPrompt(false);
                setAdminPasswordInput("");
            }
        } catch (error) {
            setPwPromptAlert(error.response?.data?.message || "Failed to verify admin password");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRevealPasswordClick = () => {
        if (revealedPassword) {
            setRevealedPassword("");
        } else {
            setAdminPasswordInput("");
            setPwPromptAlert("");
            setShowPasswordPrompt(true);
        }
    };

    const handleUpdate = async (actionData = null) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");

            const payload = { ...employee };
            if (actionData) {
                payload.taskAction = actionData.taskAction;
                if (actionData.reassignTo) {
                    payload.reassignTo = actionData.reassignTo;
                }
            }

            const response = await axios.put(
                `http://localhost:5000/api/employees/${id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (showTaskTransferModal) {
                setShowTaskTransferModal(false);
            }

            showAlert(response.data.message || "Employee updated successfully.", "success");
            setEditing(false);
            // Re-fetch from DB to confirm save persisted
            await fetchEmployee();
        } catch (error) {
            console.error("[Update] Error:", error.response?.data || error.message);
            if (error.response?.status === 409 && error.response?.data?.requireTaskAction) {
                setTaskTransferData(error.response.data);
                
                // Fetch employees for reassignment dropdown
                const token = localStorage.getItem("token");
                axios.get("http://localhost:5000/api/employees", { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => {
                        const emps = res.data.employees || [];
                        const filtered = emps.filter(e => e.department === error.response.data.oldDepartment && e.id !== parseInt(id));
                        setDepartmentEmployees(filtered);
                        if (filtered.length > 0) {
                            setReassignTo(filtered[0].employee_id);
                        }
                    }).catch(err => console.log(err));

                setShowTaskTransferModal(true);
            } else {
                showAlert(error.response?.data?.message || "Failed to update employee details.", "error");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => setIsDeleteModalOpen(true);

    const handleConfirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `http://localhost:5000/api/employees/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate("/admin/employees");
        } catch (error) {
            console.log(error);
            showAlert(error.response?.data?.message || "Failed to delete employee.", "error");
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const getInitials = (firstName, lastName) => {
        const f = firstName ? firstName.charAt(0).toUpperCase() : "";
        const l = lastName ? lastName.charAt(0).toUpperCase() : "";
        return `${f}${l}` || "EE";
    };

    if (!employee) {
        return (
            <DashboardLayout>
                <div style={{ textAlign: "center", padding: "100px" }}>
                    <p style={{ fontSize: "18px", color: "#64748b" }}>Loading employee details...</p>
                </div>
            </DashboardLayout>
        );
    }

    /* ── Shared field style ── */
    const inputStyle = {
        width: "100%",
        padding: "10px 14px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "14px",
        background: "#f8fafc",
        color: "#1e293b",
        transition: "border 0.2s",
        boxSizing: "border-box"
    };
    const labelStyle = {
        fontSize: "12px",
        fontWeight: 700,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "6px",
        display: "block"
    };
    const fieldGroupStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    };

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="employee-header" style={{ marginBottom: "20px" }}>
                <h1 className="page-title" style={{ margin: 0 }}>Employee Profile</h1>
                <button type="button"
                    className="action-btn-custom action-btn-secondary"
                    onClick={() => navigate("/admin/employees")}
                >
                    ← Back to List
                </button>
            </div>

            {/* Inline Alert Banner */}
            {alertMsg && (
                <InlineAlert
                    type={alertType}
                    message={alertMsg}
                    onClose={() => setAlertMsg("")}
                />
            )}

            <div className="profile-details-grid">
                {/* ── Left Card: Summary ── */}
                <div className="details-card">
                    <div className="details-card-avatar">
                        {getInitials(employee.first_name, employee.last_name)}
                    </div>
                    <h2 className="details-card-name">
                        {employee.first_name} {employee.last_name}
                    </h2>
                    <span className="details-card-role">{employee.designation}</span>

                    {/* Status badge */}
                    <span className="status-badge" style={{
                        background: employee.status === "Active" ? "#dcfce7" : "#fee2e2",
                        color: employee.status === "Active" ? "#166534" : "#991b1b",
                    }}>
                        {employee.status || "Active"}
                    </span>

                    <div className="details-card-divider"></div>

                    <div className="details-card-info-item">
                        <span className="details-card-info-label">Employee ID</span>
                        <span className="details-card-info-value">{employee.employee_id || `#${employee.id}`}</span>
                    </div>
                    <div className="details-card-info-item">
                        <span className="details-card-info-label">Department</span>
                        <span className="details-card-info-value">{employee.department || "N/A"}</span>
                    </div>
                    <div className="details-card-info-item">
                        <span className="details-card-info-label">Employment Type</span>
                        <span className="details-card-info-value">{employee.employment_type || "N/A"}</span>
                    </div>
                    {isAdmin && employee.salary && (
                        <div className="details-card-info-item">
                            <span className="details-card-info-label">Salary</span>
                            <span className="details-card-info-value">₹{Number(employee.salary).toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {/* ── Right Card: Info / Edit ── */}
                <div className="info-card">
                    <h3 className="info-card-title">
                        {editing ? "✏️ Edit Employee Information" : "📋 General Information"}
                    </h3>

                    {editing ? (
                        /* ════ EDIT FORM ════ */
                        <form
                            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginTop: "16px" }}
                            onSubmit={(e) => e.preventDefault()}
                        >
                            {/* First Name */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>First Name *</label>
                                <input
                                    aria-label="First Name"
                                    style={inputStyle}
                                    type="text"
                                    value={employee.first_name || ""}
                                    onChange={(e) => setEmployee({ ...employee, first_name: e.target.value })}
                                    disabled={isManager}
                                    required
                                />
                            </div>

                            {/* Last Name */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Last Name *</label>
                                <input
                                    aria-label="Last Name"
                                    style={inputStyle}
                                    type="text"
                                    value={employee.last_name || ""}
                                    onChange={(e) => setEmployee({ ...employee, last_name: e.target.value })}
                                    disabled={isManager}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div style={{ ...fieldGroupStyle, gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Work Email *</label>
                                <input
                                    aria-label="Work Email"
                                    style={inputStyle}
                                    type="email"
                                    value={employee.email || ""}
                                    onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
                                    disabled={isManager}
                                    required
                                />
                            </div>

                            {/* Mobile */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Mobile Number</label>
                                <input
                                    aria-label="Mobile Number"
                                    style={inputStyle}
                                    type="text"
                                    value={employee.mobile || ""}
                                    onChange={(e) => setEmployee({ ...employee, mobile: e.target.value })}
                                    placeholder="e.g. +91 9876543210"
                                />
                            </div>

                            {/* Gender */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Gender</label>
                                <select
                                    aria-label="Gender"
                                    style={inputStyle}
                                    value={employee.gender || ""}
                                    onChange={(e) => setEmployee({ ...employee, gender: e.target.value })}
                                    disabled={isManager}
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>

                            {/* Department */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Department *</label>
                                <select
                                    aria-label="Department"
                                    style={inputStyle}
                                    value={employee.department || ""}
                                    onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
                                    disabled={isManager}
                                    required
                                >
                                    <option value="">Select department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.department_name}>
                                            {dept.department_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Designation */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Designation *</label>
                                <input
                                    aria-label="Designation"
                                    style={inputStyle}
                                    type="text"
                                    value={employee.designation || ""}
                                    onChange={(e) => setEmployee({ ...employee, designation: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Employment Type */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Employment Type</label>
                                <select
                                    aria-label="Employment Type"
                                    style={inputStyle}
                                    value={employee.employment_type || ""}
                                    onChange={(e) => setEmployee({ ...employee, employment_type: e.target.value })}
                                >
                                    <option value="">Select type</option>
                                    <option value="Full Time">Full Time</option>
                                    <option value="Part Time">Part Time</option>
                                    <option value="Contract">Contract</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Status</label>
                                <select
                                    aria-label="Status"
                                    style={inputStyle}
                                    value={employee.status || "Active"}
                                    onChange={(e) => setEmployee({ ...employee, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Role — Admin only */}
                            {isAdmin && (
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>Role</label>
                                    <select
                                        aria-label="Role"
                                        style={inputStyle}
                                        value={employee.role || "Employee"}
                                        onChange={(e) => setEmployee({ ...employee, role: e.target.value })}
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>
                            )}

                            {/* Salary — Admin only */}
                            {isAdmin && (
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>Salary (Monthly ₹)</label>
                                    <input
                                        aria-label="Salary"
                                        style={inputStyle}
                                        type="number"
                                        min="0"
                                        value={employee.salary || ""}
                                        onChange={(e) => setEmployee({ ...employee, salary: e.target.value })}
                                        placeholder="e.g. 85000"
                                    />
                                </div>
                            )}

                            {/* Date of Birth — Admin only */}
                            {isAdmin && (
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>Date of Birth</label>
                                    <input
                                        aria-label="Date of Birth"
                                        style={inputStyle}
                                        type="date"
                                        value={employee.date_of_birth ? (() => {
                                            if (typeof employee.date_of_birth === "string" && employee.date_of_birth.includes("T")) {
                                                return employee.date_of_birth.split("T")[0];
                                            }
                                            if (employee.date_of_birth instanceof Date || !isNaN(Date.parse(employee.date_of_birth))) {
                                                const d = new Date(employee.date_of_birth);
                                                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                            }
                                            return employee.date_of_birth || "";
                                        })() : ""}
                                        onChange={(e) => setEmployee({ ...employee, date_of_birth: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Probation Period — Admin only */}
                            {isAdmin && (
                                <div style={fieldGroupStyle}>
                                    <label style={labelStyle}>Probation Period</label>
                                    <select
                                        aria-label="Probation Period"
                                        style={inputStyle}
                                        value={employee.probation_period || "Ongoing"}
                                        onChange={(e) => setEmployee({ ...employee, probation_period: e.target.value })}
                                    >
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
                                <button
                                    type="button"
                                    className="action-btn-custom action-btn-secondary"
                                    onClick={() => setEditing(false)}
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
                        </form>
                    ) : (
                            /* ════ VIEW MODE ════ */
                        <div>
                                {/* 2-col info grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                                    <InfoRow icon={<FaIdBadge />} label="ID Reference" value={`#${employee.id}`} />
                                    <InfoRow icon={<FaIdBadge />} label="Employee ID" value={employee.employee_id || "—"} />
                                    <InfoRow icon={<FaUser />} label="First Name" value={employee.first_name} />
                                    <InfoRow icon={<FaUser />} label="Last Name" value={employee.last_name} />
                                    <InfoRow icon={<FaEnvelope />} label="Email Address" value={employee.email} fullWidth />
                                    <InfoRow icon={<FaPhone />} label="Mobile" value={employee.mobile || "—"} />
                                    <InfoRow icon={<FaVenusMars />} label="Gender" value={employee.gender || "—"} />
                                    <InfoRow icon={<FaBuilding />} label="Department" value={employee.department || "—"} />
                                    <InfoRow icon={<FaIdBadge />} label="Designation" value={employee.designation} />
                                    <InfoRow icon={<FaBriefcase />} label="Employment Type" value={employee.employment_type || "—"} />
                                    <InfoRow icon={<FaUser />} label="Role" value={employee.role || "Employee"} />
                                    <InfoRow icon={<FaCalendarAlt />} label="Join Date" value={employee.joining_date ? new Date(employee.joining_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
                                    {isAdmin && (
                                        <InfoRow icon={<FaMoneyBillAlt />} label="Salary" value={employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : "—"} />
                                    )}
                                    <InfoRow 
                                        icon={<FaCalendarAlt />} 
                                        label="Date of Birth" 
                                        value={employee.date_of_birth ? (() => {
                                            const parts = String(employee.date_of_birth).split("T")[0].split("-");
                                            if (parts.length === 3) {
                                                const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
                                                return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
                                            }
                                            return new Date(employee.date_of_birth).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
                                        })() : "—"} 
                                    />
                                    <InfoRow icon={<FaBriefcase />} label="Probation Period" value={employee.probation_period || "Ongoing"} />
                            </div>

                                {/* Password reveal (Admin only) */}
                            {isAdmin && (
                                    <div className="details-info-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                                    <span className="details-info-label">
                                        <FaKey style={{ marginRight: "8px", verticalAlign: "middle" }} /> Password
                                    </span>
                                    <span className="details-info-value" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        {revealedPassword ? (
                                            <span style={{ fontWeight: "700", fontFamily: "monospace", fontSize: "16px", color: "#4f46e5", background: "#eeebff", padding: "4px 8px", borderRadius: "6px" }}>
                                                {revealedPassword}
                                            </span>
                                        ) : (
                                            <span style={{ color: "#94a3b8", letterSpacing: "3px", fontWeight: "700" }}>••••••••</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleRevealPasswordClick}
                                                style={{ border: "none", background: "#e0e7ff", color: "#4f46e5", padding: "6px 12px", borderRadius: "6px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                                        >
                                            {revealedPassword ? "Hide" : "Show Password"}
                                        </button>
                                    </span>
                                </div>
                            )}

                            <div className="actions-container" style={{ marginTop: "24px" }}>
                                {isAdmin && (
                                        <button type="button" className="action-btn-custom action-btn-danger" onClick={handleDeleteClick}>
                                        <FaTrash /> Delete
                                    </button>
                                )}
                                {!(isManager && employee.email === loggedInUser.email) && (
                                        <button type="button" className="action-btn-custom action-btn-primary" onClick={() => setEditing(true)}>
                                        <FaEdit /> Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Password Prompt Modal */}
            {showPasswordPrompt && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        width: "100%", maxWidth: "400px", padding: "30px",
                        borderRadius: "12px", background: "white",
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0"
                    }}>
                        <h3 style={{ margin: "0 0 12px 0", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: "#1e293b" }}>
                            <FaLock style={{ color: "#4f46e5" }} /> Verify Admin Identity
                        </h3>
                        <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "#64748b", lineHeight: "1.5" }}>
                            Enter your administrator password to reveal this employee's credentials.
                        </p>

                        {/* Inline error inside modal */}
                        {pwPromptAlert && (
                            <InlineAlert type="error" message={pwPromptAlert} onClose={() => setPwPromptAlert("")} />
                        )}

                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Admin Password</label>
                            <input
                                aria-label="Admin Password"
                                type="password"
                                placeholder="Enter your admin password"
                                value={adminPasswordInput}
                                onChange={(e) => setAdminPasswordInput(e.target.value)}
                                autoComplete="new-password"
                                style={{ ...inputStyle, marginTop: "4px" }}
                                onKeyDown={(e) => { if (e.key === "Enter") handleVerifyAdminPassword(); }}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="action-btn-custom action-btn-secondary"
                                onClick={() => { setShowPasswordPrompt(false); setAdminPasswordInput(""); setPwPromptAlert(""); }}
                                style={{ padding: "8px 16px", fontSize: "13px" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="action-btn-custom action-btn-primary"
                                onClick={handleVerifyAdminPassword}
                                style={{ padding: "8px 16px", fontSize: "13px" }}
                            >
                                Verify & Show
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CustomConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete employee '${employee?.first_name} ${employee?.last_name}'? This action cannot be undone.`}
                confirmText="Delete Anyway"
                cancelText="Cancel"
                type="danger"
            />
            {showTaskTransferModal && taskTransferData && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
                    <div style={{ width: "100%", maxWidth: "500px", padding: "0", borderRadius: "16px", background: "white", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        
                        <div style={{ background: "#f8fafc", padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
                            <h3 style={{ margin: 0, fontWeight: "700", fontSize: "18px", color: "#0f172a" }}>Employee Transfer</h3>
                            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>{taskTransferData.employee}</p>
                        </div>

                        <div style={{ padding: "24px" }}>
                            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                                <div style={{ flex: 1, padding: "12px", background: "#f1f5f9", borderRadius: "8px" }}>
                                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Current Dept</div>
                                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#334155", marginTop: "4px" }}>{taskTransferData.oldDepartment}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", color: "#94a3b8" }}>➔</div>
                                <div style={{ flex: 1, padding: "12px", background: "#eff6ff", borderRadius: "8px" }}>
                                    <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "600", textTransform: "uppercase" }}>New Dept</div>
                                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#1d4ed8", marginTop: "4px" }}>{taskTransferData.newDepartment}</div>
                                </div>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px dashed #cbd5e1", margin: "0 0 20px" }} />

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                <div>
                                    <span style={{ fontSize: "14px", color: "#475569" }}>Active Tasks:</span>
                                    <span style={{ marginLeft: "8px", fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>{taskTransferData.activeTasks}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: "14px", color: "#475569" }}>Completed Tasks:</span>
                                    <span style={{ marginLeft: "8px", fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>{taskTransferData.completedTasks}</span>
                                </div>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px dashed #cbd5e1", margin: "0 0 24px" }} />

                            <h4 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1e293b", fontWeight: "600" }}>Choose how to handle active tasks</h4>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", padding: "12px", border: `1.5px solid ${taskAction === "keep" ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "8px", background: taskAction === "keep" ? "#eff6ff" : "transparent" }}>
                                    <input type="radio" name="taskAction" value="keep" checked={taskAction === "keep"} onChange={() => setTaskAction("keep")} style={{ marginTop: "3px" }} />
                                    <div>
                                        <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px" }}>Keep assigned to {taskTransferData.employee.split(" ")[0]}</div>
                                        <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>Tasks will remain owned by {taskTransferData.oldDepartment} but {taskTransferData.employee.split(" ")[0]} continues working on them.</div>
                                    </div>
                                </label>
                                
                                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", padding: "12px", border: `1.5px solid ${taskAction === "reassign" ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "8px", background: taskAction === "reassign" ? "#eff6ff" : "transparent" }}>
                                    <input type="radio" name="taskAction" value="reassign" checked={taskAction === "reassign"} onChange={() => setTaskAction("reassign")} style={{ marginTop: "3px" }} />
                                    <div style={{ width: "100%" }}>
                                        <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px" }}>Reassign active tasks</div>
                                        {taskAction === "reassign" && (
                                            <div style={{ marginTop: "12px" }}>
                                                <select aria-label="Reassign to" value={reassignTo} onChange={e => setReassignTo(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                                                    <option value="" disabled>Select Employee</option>
                                                    {departmentEmployees.map(e => (
                                                        <option key={e.employee_id} value={e.employee_id}>{e.first_name} {e.last_name} ({e.employee_id})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>

                        </div>

                        <div style={{ background: "#f8fafc", padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <button type="button" onClick={() => setShowTaskTransferModal(false)} style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: "600", fontSize: "14px", cursor: "pointer", padding: "8px 12px", borderRadius: "6px" }} onMouseEnter={e => e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>Cancel Transfer</button>
                            <button type="button" disabled={isSaving || (taskAction === "reassign" && !reassignTo)} onClick={() => handleUpdate({ taskAction, reassignTo })} style={{ background: "#4f46e5", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", opacity: isSaving || (taskAction === "reassign" && !reassignTo) ? 0.7 : 1 }}>
                                {isSaving ? "Saving..." : "Confirm Transfer"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

/* ── Small helper component for info rows ── */
function InfoRow({ icon, label, value, fullWidth }) {
    return (
        <div className="details-info-row" style={fullWidth ? { gridColumn: "1 / -1" } : {}}>
            <span className="details-info-label">
                <span style={{ marginRight: "8px", verticalAlign: "middle" }}>{icon}</span>
                {label}
            </span>
            <span className="details-info-value">{value}</span>
        </div>
    );
}

export default EmployeeDetails;