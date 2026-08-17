import { useEffect, useState } from "react";
import axios from "axios";
import useSWR from "swr";
import { FaBuilding, FaPlus, FaEye, FaTimes } from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import InlineAlert from "../../components/InlineAlert";

const fetcher = (url) => axios.get(url).then(res => res.data);

function Departments() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [departmentName, setDepartmentName] = useState("");
    const [modalAlert, setModalAlert] = useState("");
    const [modalAlertType, setModalAlertType] = useState("error");
    const [isSubmitting, setIsSubmitting] = useState(false);


    const { data: deptData, mutate: fetchDepartments } = useSWR("http://localhost:5000/api/departments", fetcher);

    useEffect(() => {
        if (deptData) {
            setDepartments(deptData);
        }
    }, [deptData]);

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setModalAlert("");

        if (!departmentName.trim()) {
            setModalAlert("Department name is required.");
            setModalAlertType("warning");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(
                "http://localhost:5000/api/departments",
                { department_name: departmentName }
            );
            setDepartmentName("");
            setShowAddModal(false);
            fetchDepartments();
        } catch (error) {
            console.log(error);
            setModalAlert(error.response?.data?.message || "Failed to add department.");
            setModalAlertType("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            {/* Header section with add button */}
            <div className="employee-header" style={{ marginBottom: "24px" }}>
                <h1 className="page-title" style={{ margin: 0 }}>Departments</h1>
                <button type="button"
                    className="add-btn"
                    onClick={() => setShowAddModal(true)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "600" }}
                >
                    <FaPlus /> Add Department
                </button>
            </div>

            {/* Full-width table */}
            <div className="table-container-custom">
                <table className="employee-table">
                    <thead>
                        <tr>
                            <th style={{ width: "120px" }}>ID</th>
                            <th>Department Name</th>
                            <th style={{ textAlign: "center", width: "150px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map((dept) => (
                            <tr key={dept.id}>
                                <td>#{dept.id}</td>
                                <td style={{ fontWeight: "600" }}>{dept.department_name}</td>
                                <td style={{ textAlign: "center" }}>
                                    <button type="button"
                                        className="table-action-btn"
                                        aria-label="View Department"
                                        onClick={() => navigate(`/admin/departments/${dept.id}`)}
                                        title="View Details"
                                    >
                                        <FaEye />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {departments.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                                    No departments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Department Modal Overlay */}
            {showAddModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div className="form-card" style={{
                        width: "100%",
                        maxWidth: "480px",
                        padding: "32px",
                        borderRadius: "16px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        background: "white",
                        position: "relative"
                    }}>
                        <button type="button"
                            onClick={() => { setShowAddModal(false); setDepartmentName(""); }}
                            aria-label="Close modal"
                            style={{
                                position: "absolute",
                                top: "20px",
                                right: "20px",
                                background: "none",
                                border: "none",
                                fontSize: "18px",
                                color: "#64748b",
                                cursor: "pointer"
                            }}
                        >
                            <FaTimes />
                        </button>

                        <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                            <FaBuilding style={{ color: "var(--primary)" }} /> Add Department
                        </h3>

                        <InlineAlert
                            type={modalAlertType}
                            message={modalAlert}
                            onClose={() => setModalAlert("")}
                        />

                        <form onSubmit={handleAddDepartment} className="form-group" style={{ margin: 0 }}>
                            <div className="form-group-custom" style={{ marginBottom: "20px" }}>
                                <label className="form-label-custom" htmlFor="add-dept-name">Department Name</label>
                                <input
                                    type="text"
                                    id="add-dept-name"
                                    placeholder="Enter department name (e.g. Sales, HR)"
                                    value={departmentName}
                                    onChange={(e) => setDepartmentName(e.target.value)}
                                    style={{
                                        padding: "12px",
                                        width: "100%",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        marginTop: "6px"
                                    }}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    className="action-btn-custom action-btn-secondary"
                                    onClick={() => { setShowAddModal(false); setDepartmentName(""); }}
                                    style={{ padding: "10px 20px" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={isSubmitting}
                                    style={{ margin: 0, padding: "10px 20px", width: "auto", opacity: isSubmitting ? 0.6 : 1 }}
                                >
                                    {isSubmitting ? "Saving..." : "Save Department"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default Departments;