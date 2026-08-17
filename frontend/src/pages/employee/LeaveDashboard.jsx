import { useEffect, useReducer } from "react";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaPlus, FaTimes } from "react-icons/fa";
import CustomConfirmModal from "../../components/CustomConfirmModal";

const fetcherAuth = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);
const fetcher = (url) => axios.get(url).then(res => res.data);

const leaveReducer = (state, action) => {
    switch(action.type) {
        case "UPDATE_DATA": return { ...state, ...action.payload };
        case "SET_FIELD": return { ...state, [action.field]: action.value };
        case "SET_MODAL": return { ...state, confirmModal: { ...state.confirmModal, ...action.payload } };
        case "SET_MESSAGE": return { ...state, message: action.payload };
        case "RESET_FORM": return { ...state, leaveTypeId: "", startDate: "", endDate: "", reason: "", showApplyModal: false };
        default: return state;
    }
};

function LeaveDashboard() {
    const [state, dispatch] = useReducer(leaveReducer, {
        leaveTypes: [], history: [], loading: true, actionLoading: false, message: null, showApplyModal: false,
        confirmModal: { isOpen: false, requestId: null, currentStatus: "", message: "" },
        leaveTypeId: "", startDate: "", endDate: "", reason: ""
    });
    const { leaveTypes, history, loading, actionLoading, message, showApplyModal, confirmModal, leaveTypeId, startDate, endDate, reason } = state;

    const showNotification = (type, text) => {
        dispatch({ type: "SET_MESSAGE", payload: { type, text } });
        setTimeout(() => dispatch({ type: "SET_MESSAGE", payload: null }), 5000);
    };




    const { data: typesData } = useSWR("http://localhost:5000/api/leaves/types", fetcher);
    const { data: historyData, isLoading: historyLoading, mutate: fetchData } = useSWR("http://localhost:5000/api/leaves/history", fetcherAuth);

    useEffect(() => {
        if (typesData) {
            dispatch({ type: "UPDATE_DATA", payload: { leaveTypes: typesData.types || [] } });
        }
    }, [typesData]);

    useEffect(() => {
        dispatch({ type: "UPDATE_DATA", payload: { loading: historyLoading && !historyData } });
        if (historyData) {
            dispatch({ type: "UPDATE_DATA", payload: { history: historyData.history || [] } });
        }
    }, [historyData, historyLoading]);

    // Auto-calculate requested duration
    const calculateRequestedDays = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end - start;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
        return days > 0 ? days : 0;
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        const totalDays = calculateRequestedDays();
        if (totalDays <= 0) {
            showNotification("error", "End Date must be after or equal to Start Date.");
            return;
        }

        try {
            dispatch({ type: "UPDATE_DATA", payload: { actionLoading: true } });
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/api/leaves/apply",
                {
                    leave_type_id: parseInt(leaveTypeId),
                    start_date: startDate,
                    end_date: endDate,
                    reason
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showNotification("success", response.data.message || "Leave applied successfully.");
            
            // Reset form
            dispatch({ type: "RESET_FORM" });

            fetchData();
        } catch (error) {
            console.error("Apply leave error:", error);
            showNotification(
                "error",
                error.response?.data?.message || "Failed to submit leave request."
            );
        } finally {
            dispatch({ type: "UPDATE_DATA", payload: { actionLoading: false } });
        }
    };

    const handleCancelRequestClick = (requestId, currentStatus) => {
        const confirmMsg = currentStatus === "Approved"
            ? "Are you sure you want to request cancellation for this approved leave?"
            : "Are you sure you want to cancel this pending leave request?";
        dispatch({ type: "SET_MODAL", payload: { isOpen: true, requestId, currentStatus, message: confirmMsg } });
    };

    const handleConfirmCancelRequest = async () => {
        const { requestId, currentStatus } = confirmModal;
        try {
            dispatch({ type: "UPDATE_DATA", payload: { actionLoading: true } });
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/leaves/cancel/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const successMsg = currentStatus === "Approved"
                ? "Cancellation request submitted successfully."
                : "Leave request cancelled successfully.";
            showNotification("success", successMsg);
            fetchData();
        } catch (error) {
            console.error("Cancel leave request error:", error);
            showNotification(
                "error",
                error.response?.data?.message || "Failed to cancel leave request."
            );
        } finally {
            dispatch({ type: "UPDATE_DATA", payload: { actionLoading: false } });
            dispatch({ type: "SET_MODAL", payload: { isOpen: false, requestId: null, currentStatus: "", message: "" } });
        }
    };


    const formatDateNice = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Approved": return "badge-present"; // green
            case "Pending": return "badge-late"; // orange
            case "Pending Cancellation": return "badge-late"; // orange
            case "Cancelled": return "badge-absent"; // red
            case "Rejected": return "badge-absent"; // red
            default: return "badge-neutral";
        }
    };

    return (
        <DashboardLayout>
            <div className="attendance-page-container">
                <div className="employee-header" style={{ marginBottom: "24px" }}>
                    <h1 className="page-title" style={{ margin: 0 }}>My Leave Management</h1>
                    <button type="button"
                        className="add-btn"
                        onClick={() => dispatch({ type: "UPDATE_DATA", payload: { showApplyModal: true } })}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "600" }}
                    >
                        <FaPlus /> Apply for Leave
                    </button>
                </div>

                {message && (
                    <div className={`alert-banner alert-${message.type}`}>
                        {message.text}
                    </div>
                )}


                {/* History Section */}
                <div className="history-section">
                    <h2>Leave Requests History</h2>
                    <div className="table-container-custom">
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>Leave Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Total Days</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Rejection Remarks</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: "center", color: "#64748b" }}>
                                            Loading records...
                                        </td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: "center", color: "#64748b" }}>
                                            No leave requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((record) => (
                                        <tr key={record.id}>
                                            <td style={{ fontWeight: "600" }}>{record.leave_type_name}</td>
                                            <td>{formatDateNice(record.start_date)}</td>
                                            <td>{formatDateNice(record.end_date)}</td>
                                            <td style={{ fontWeight: "700", color: "#475569" }}>{record.total_days} days</td>
                                            <td>
                                                <span style={{ fontSize: "13.5px", color: "#475569" }}>{record.reason}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td style={{ color: "#ef4444", fontStyle: "italic", fontSize: "13px" }}>
                                                {record.rejection_remarks || "--"}
                                            </td>
                                            <td>
                                                {record.status === "Pending" ? (
                                                    <button type="button"
                                                        className="clear-date-btn"
                                                        onClick={() => handleCancelRequestClick(record.id, record.status)}
                                                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#ef4444" }}
                                                        disabled={actionLoading}
                                                    >
                                                        <FaTimes /> Cancel
                                                    </button>
                                                ) : record.status === "Approved" ? (
                                                    <button type="button"
                                                        className="clear-date-btn"
                                                        onClick={() => handleCancelRequestClick(record.id, "Approved")}
                                                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#f59e0b", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
                                                        disabled={actionLoading}
                                                    >
                                                        <FaTimes /> Request Cancel
                                                    </button>
                                                ) : record.status === "Pending Cancellation" ? (
                                                    <span style={{ fontStyle: "italic", color: "#f59e0b", fontSize: "13px", fontWeight: "600" }}>
                                                        Cancellation Pending
                                                    </span>
                                                ) : "--"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Apply Leave Modal Form */}
                {showApplyModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="form-card" style={{ width: "90%", maxWidth: "500px", margin: 0, position: "relative" }}>
                            <button type="button"
                                aria-label="Close modal"
                                onClick={() => dispatch({ type: "UPDATE_DATA", payload: { showApplyModal: false } })}
                                style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#94a3b8" }}
                            >
                                <FaTimes />
                            </button>
                            
                            <h2 style={{ marginBottom: "20px", fontWeight: "700", fontSize: "20px" }}>Request Time Off</h2>
                            
                            <form onSubmit={handleApplyLeave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Leave Type</label>
                                    <select
                                        aria-label="Leave Type"
                                        value={leaveTypeId}
                                        onChange={(e) => dispatch({ type: "SET_FIELD", field: "leaveTypeId", value: e.target.value })}
                                        style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", fontSize: "14px" }}
                                        required
                                    >
                                        <option value="">Select Leave Type</option>
                                        {leaveTypes.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: "flex", gap: "16px" }}>
                                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                                        <label>Start Date</label>
                                        <input
                                            aria-label="Start Date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => dispatch({ type: "SET_FIELD", field: "startDate", value: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                                        <label>End Date</label>
                                        <input
                                            aria-label="End Date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => dispatch({ type: "SET_FIELD", field: "endDate", value: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {startDate && endDate && (
                                    <div style={{ background: "#eff6ff", color: "#2563eb", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", fontWeight: "600" }}>
                                        Total requested duration: {calculateRequestedDays()} days
                                    </div>
                                )}

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Reason for Leave</label>
                                    <textarea
                                        aria-label="Reason for Leave"
                                        value={reason}
                                        onChange={(e) => dispatch({ type: "SET_FIELD", field: "reason", value: e.target.value })}
                                        placeholder="Please provide details about your request..."
                                        rows="4"
                                        style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", resize: "none", fontSize: "14px" }}
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{
                                        background: "#4f8cff",
                                        color: "white",
                                        border: "none",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >
                                    {actionLoading ? "Submitting..." : "Submit Application"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <CustomConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => dispatch({ type: "SET_MODAL", payload: { isOpen: false, requestId: null, currentStatus: "", message: "" } })}
                onConfirm={handleConfirmCancelRequest}
                title="Cancel Leave Request"
                message={confirmModal.message}
                confirmText={confirmModal.currentStatus === "Approved" ? "Request Cancellation" : "Cancel Request"}
                cancelText="Keep Request"
                type={confirmModal.currentStatus === "Approved" ? "warning" : "danger"}
            />
        </DashboardLayout>
    );
}

export default LeaveDashboard;
