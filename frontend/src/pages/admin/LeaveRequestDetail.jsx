import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import {

    FaArrowLeft, FaCheck, FaTimes, FaUser, FaCalendarAlt,
    FaBuilding, FaIdBadge, FaClock, FaStickyNote, FaBriefcase
} from "react-icons/fa";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

function LeaveRequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loggedInUser = JSON.parse(localStorage.getItem("user:v1")) || {};

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionRemarks, setRejectionRemarks] = useState("");

    const showNotification = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };


    const { data: reqData, isLoading: reqLoading, mutate: fetchRequest } = useSWR("http://localhost:5000/api/leaves/admin/requests", fetcher);

    useEffect(() => {
        setLoading(reqLoading && !reqData);
        if (reqData) {
            const found = (reqData.requests || []).find((r) => String(r.id) === String(id));
            setRequest(found || null);
        }
    }, [reqData, reqLoading, id]);

    const handleAction = async (action, remarks = "") => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/api/leaves/admin/action",
                { id: Number(id), action, rejection_remarks: remarks },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showNotification("success", response.data.message || `Leave ${action.toLowerCase()} successfully.`);
            setShowRejectModal(false);
            setRejectionRemarks("");
            fetchRequest();
        } catch (error) {
            showNotification("error", error.response?.data?.message || "Failed to process action.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });
    };

    const getInitials = (first, last) => {
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "EE";
    };

    const statusColor = {
        Approved: { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
        Pending:  { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" },
        Rejected: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
        "Pending Cancellation": { bg: "#fee2e2", color: "#ca8a04", border: "#fecaca" },
        Cancelled: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" }
    };

    return (
        <DashboardLayout>
            <div className="attendance-page-container">
                {/* Back navigation */}
                <button type="button"
                    onClick={() => navigate("/admin/leaves")}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#4f8cff", fontWeight: "600", fontSize: "14px",
                        marginBottom: "24px", padding: 0
                    }}
                >
                    <FaArrowLeft /> Back to Leave Requests
                </button>

                {/* Notification */}
                {message && (
                    <div className={`alert-banner alert-${message.type}`} style={{ marginBottom: "20px" }}>
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", color: "#64748b", padding: "60px 0" }}>Loading leave details...</div>
                ) : !request ? (
                    <div style={{ textAlign: "center", color: "#ef4444", padding: "60px 0" }}>Leave request not found.</div>
                ) : (
                    <>
                        {/* Header card */}
                        <div style={{
                            background: "white", borderRadius: "16px", padding: "32px",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: "24px",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            flexWrap: "wrap", gap: "20px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                <div className="avatar-badge" style={{ width: "64px", height: "64px", fontSize: "22px", borderRadius: "50%", flexShrink: 0 }}>
                                    {getInitials(request.first_name, request.last_name)}
                                </div>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#1e293b" }}>
                                        {request.first_name} {request.last_name}
                                    </h1>
                                    <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
                                        {request.designation || "Employee"} &bull; {request.department || "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                ...statusColor[request.status],
                                padding: "10px 22px", borderRadius: "30px",
                                fontWeight: "700", fontSize: "15px",
                                border: `1.5px solid ${statusColor[request.status]?.border}`
                            }}>
                                {request.status}
                            </div>
                        </div>

                        {/* Details grid */}
                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "20px", marginBottom: "24px"
                        }}>
                            {[
                                { icon: <FaIdBadge />, label: "Employee ID", value: request.employee_id },
                                { icon: <FaBuilding />, label: "Department", value: request.department || "N/A" },
                                { icon: <FaBriefcase />, label: "Designation", value: request.designation || "N/A" },
                                { icon: <FaUser />, label: "Leave Type", value: request.leave_type_name },
                                { icon: <FaClock />, label: "Duration", value: `${request.total_days} day${request.total_days !== 1 ? "s" : ""}` },
                                { icon: <FaCalendarAlt />, label: "Start Date", value: formatDate(request.start_date) },
                                { icon: <FaCalendarAlt />, label: "End Date", value: formatDate(request.end_date) },
                                { icon: <FaCalendarAlt />, label: "Applied On", value: formatDate(request.created_at) },
                            ].map(({ icon, label, value }) => (
                                <div key={label} style={{
                                    background: "white", borderRadius: "12px", padding: "20px 24px",
                                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)", display: "flex", gap: "16px", alignItems: "flex-start"
                                }}>
                                    <span style={{ color: "#4f8cff", fontSize: "18px", marginTop: "2px", flexShrink: 0 }}>{icon}</span>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
                                        <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reason card */}
                        <div style={{
                            background: "white", borderRadius: "12px", padding: "24px",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: "24px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                <FaStickyNote style={{ color: "#4f8cff", fontSize: "16px" }} />
                                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>Reason for Leave</h3>
                            </div>
                            <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.7", background: "#f8fafc", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #4f8cff" }}>
                                {request.reason || "No reason provided."}
                            </p>
                        </div>

                        {/* Rejection remarks (if rejected) */}
                        {request.status === "Rejected" && request.rejection_remarks && (
                            <div style={{
                                background: "#fff5f5", borderRadius: "12px", padding: "24px",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: "24px",
                                borderLeft: "4px solid #ef4444"
                            }}>
                                <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: "700", color: "#dc2626" }}>Rejection Remarks</h3>
                                <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.7" }}>
                                    {request.rejection_remarks}
                                </p>
                            </div>
                        )}

                        {/* Action buttons — for Pending or Pending Cancellation */}
                        {(request.status === "Pending" || request.status === "Pending Cancellation") && (
                            request.email === loggedInUser.email ? (
                                <div style={{ background: "#eff6ff", color: "#2563eb", padding: "16px", borderRadius: "10px", fontWeight: "600", fontSize: "14px", border: "1.5px solid #bfdbfe", textAlign: "left" }}>
                                    This leave request was submitted by you. Self-approval is not allowed.
                                </div>
                            ) : (
                                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                    <button type="button"
                                        onClick={() => handleAction("Approved")}
                                        disabled={actionLoading}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: "10px",
                                            background: "#22c55e", color: "white", border: "none",
                                            padding: "14px 32px", borderRadius: "10px", cursor: "pointer",
                                            fontWeight: "700", fontSize: "15px", transition: "opacity 0.2s",
                                            opacity: actionLoading ? 0.6 : 1
                                        }}
                                    >
                                        <FaCheck /> {request.status === "Pending Cancellation" ? "Approve Cancellation" : "Approve Leave"}
                                    </button>
                                    <button type="button"
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={actionLoading}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: "10px",
                                            background: "#dc2626", color: "white", border: "none",
                                            padding: "14px 32px", borderRadius: "10px", cursor: "pointer",
                                            fontWeight: "700", fontSize: "15px", transition: "opacity 0.2s",
                                            opacity: actionLoading ? 0.6 : 1
                                        }}
                                    >
                                        <FaTimes /> {request.status === "Pending Cancellation" ? "Reject Cancellation" : "Reject Leave"}
                                    </button>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Reject Remarks Modal */}
            {showRejectModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(15,23,42,0.45)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div className="form-card" style={{ width: "90%", maxWidth: "460px", margin: 0, position: "relative" }}>
                        <button type="button"
                            aria-label="Close modal"
                            onClick={() => setShowRejectModal(false)}
                            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}
                        >
                            <FaTimes />
                        </button>

                        <h2 style={{ marginBottom: "6px", fontWeight: "700", fontSize: "20px", color: "#dc2626" }}>
                            {request.status === "Pending Cancellation" ? "Reject Leave Cancellation" : "Reject Leave Request"}
                        </h2>
                        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#64748b" }}>
                            {request.status === "Pending Cancellation"
                                ? "Provide a reason so the employee knows why their cancellation request was denied."
                                : "Provide a reason so the employee understands the decision."}
                        </p>

                        <div className="form-group" style={{ margin: "0 0 16px" }}>
                            <label>Rejection Remarks</label>
                            <textarea
                                aria-label="Rejection Remarks"
                                value={rejectionRemarks}
                                onChange={(e) => setRejectionRemarks(e.target.value)}
                                placeholder="e.g. Insufficient staffing during this period..."
                                rows="4"
                                style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", resize: "none", fontSize: "14px" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button type="button"
                                onClick={() => setShowRejectModal(false)}
                                style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                            >
                                Cancel
                            </button>
                            <button type="button"
                                onClick={() => handleAction("Rejected", rejectionRemarks)}
                                disabled={actionLoading}
                                style={{ background: "#dc2626", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", opacity: actionLoading ? 0.6 : 1 }}
                            >
                                {actionLoading ? "Processing..." : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default LeaveRequestDetail;
