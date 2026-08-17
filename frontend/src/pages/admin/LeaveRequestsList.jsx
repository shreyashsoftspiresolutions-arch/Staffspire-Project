import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaCheck, FaTimes, FaSearch, FaRegClock, FaExclamationCircle, FaEye } from "react-icons/fa";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

function LeaveRequestsList() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approvedToday: 0, rejectedToday: 0, currentlyOnLeave: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [message, setMessage] = useState(null);

    // Reject remarks modal states
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [rejectionRemarks, setRejectionRemarks] = useState("");

    const showNotification = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };


    const { data: reqData, isLoading: reqLoading, mutate: mutateRequests } = useSWR("http://localhost:5000/api/leaves/admin/requests", fetcher);
    const { data: statsData, mutate: mutateStats } = useSWR("http://localhost:5000/api/leaves/admin/stats", fetcher);

    useEffect(() => {
        setLoading(reqLoading && !reqData);
        if (reqData) setRequests(reqData.requests || []);
        if (statsData) setStats(statsData.stats || { pending: 0, approvedToday: 0, rejectedToday: 0, currentlyOnLeave: 0 });
    }, [reqData, statsData, reqLoading]);

    const fetchData = () => {
        mutateRequests();
        mutateStats();
    };

    const handleAction = async (requestId, action, remarks = "") => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/api/leaves/admin/action",
                {
                    id: requestId,
                    action,
                    rejection_remarks: remarks
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showNotification("success", response.data.message || `Request successfully ${action.toLowerCase()}!`);
            setShowRejectModal(false);
            setRejectionRemarks("");
            fetchData();
        } catch (error) {
            console.error("Leave action processing error:", error);
            showNotification(
                "error",
                error.response?.data?.message || "Failed to process leave action."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const triggerRejectPrompt = (requestId) => {
        setSelectedRequestId(requestId);
        setShowRejectModal(true);
    };

    const getInitials = (firstName, lastName) => {
        const f = firstName ? firstName.charAt(0).toUpperCase() : "";
        const l = lastName ? lastName.charAt(0).toUpperCase() : "";
        return `${f}${l}` || "EE";
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
            case "Rejected": return "badge-absent"; // red
            default: return "badge-neutral";
        }
    };

    const filteredRequests = requests.filter((record) => {
        const fullName = `${record.first_name || ""} ${record.last_name || ""}`.toLowerCase();
        const empId = (record.employee_id || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesQuery = fullName.includes(query) || empId.includes(query);
        const matchesStatus = statusFilter === "" || record.status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    return (
        <DashboardLayout>
            <div className="attendance-page-container">
                <div className="employee-header" style={{ marginBottom: "24px" }}>
                    <h1 className="page-title" style={{ margin: 0 }}>Leave Requests Registry</h1>
                </div>

                {message && (
                    <div className={`alert-banner alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Leave stats grid */}
                <div className="admin-stats-grid" style={{ marginBottom: "28px" }}>
                    <div className="attendance-card stat-metric-card">
                        <div className="stat-meta">
                            <span className="stat-label">Pending Approvals</span>
                            <FaRegClock className="stat-icon" style={{ color: "#f59e0b" }} />
                        </div>
                        <div className="stat-val">{stats.pending}</div>
                    </div>
                    <div className="attendance-card stat-metric-card">
                        <div className="stat-meta">
                            <span className="stat-label">Approved Today</span>
                            <FaCheck className="stat-icon" style={{ color: "#22c55e" }} />
                        </div>
                        <div className="stat-val">{stats.approvedToday}</div>
                    </div>
                    <div className="attendance-card stat-metric-card">
                        <div className="stat-meta">
                            <span className="stat-label">Currently On Leave</span>
                            <FaExclamationCircle className="stat-icon" style={{ color: "#3b82f6" }} />
                        </div>
                        <div className="stat-val">{stats.currentlyOnLeave}</div>
                    </div>
                </div>

                {/* Filter section */}
                <div className="filters-card">
                    <div className="search-box">
                        <FaSearch className="filter-icon" />
                        <input
                            aria-label="Search employee name or ID"
                            type="text"
                            placeholder="Search employee name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="date-filter-box" style={{ background: "transparent", border: "none", padding: 0 }}>
                        <select
                            aria-label="Filter by status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 16px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                fontSize: "14px",
                                color: "#475569",
                                fontWeight: "500"
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Leaves Table */}
                <div className="table-container-custom">
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Emp ID</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Leave Type</th>
                                <th>Duration</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th style={{ textAlign: "center" }}>View</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: "center", color: "#64748b" }}>
                                        Loading records...
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: "center", color: "#64748b" }}>
                                        No leave requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((record) => (
                                    <tr key={record.id}>
                                        <td>
                                            <div className="avatar-badge">
                                                {getInitials(record.first_name, record.last_name)}
                                            </div>
                                        </td>
                                        <td>{record.employee_id}</td>
                                        <td style={{ fontWeight: "600" }}>
                                            {record.first_name} {record.last_name}
                                        </td>
                                        <td>
                                            <span className="dept-tag">{record.department || "N/A"}</span>
                                        </td>
                                        <td style={{ fontWeight: "600", color: "#475569" }}>{record.leave_type_name}</td>
                                        <td style={{ fontWeight: "700", color: "#475569" }}>{record.total_days} days</td>
                                        <td>{formatDateNice(record.start_date)}</td>
                                        <td>{formatDateNice(record.end_date)}</td>
                                        <td style={{ maxWidth: "180px" }}>
                                            <span style={{ fontSize: "13.5px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{record.reason}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button type="button"
                                                aria-label="View Details"
                                                onClick={() => navigate(`/admin/leaves/${record.id}`)}
                                                title="View Details"
                                                style={{
                                                    background: "#eff6ff",
                                                    color: "#2563eb",
                                                    border: "1.5px solid #bfdbfe",
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "15px",
                                                    transition: "all 0.2s"
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background="#2563eb"; e.currentTarget.style.color="white"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background="#eff6ff"; e.currentTarget.style.color="#2563eb"; }}
                                            >
                                                <FaEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Reject Remarks Modal Prompt */}
                {showRejectModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="form-card" style={{ width: "90%", maxWidth: "450px", margin: 0, position: "relative" }}>
                            <button type="button"
                                                aria-label="Close modal"
                                onClick={() => setShowRejectModal(false)}
                                style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}
                            >
                                <FaTimes />
                            </button>
                            
                            <h2 style={{ marginBottom: "20px", fontWeight: "700", fontSize: "20px", color: "#ef4444" }}>Reject Request Remarks</h2>
                            
                            <div className="form-group" style={{ margin: 0, marginBottom: "16px" }}>
                                <label>Rejection Reason / Comments</label>
                                <textarea
                                    aria-label="Rejection Reason"
                                    value={rejectionRemarks}
                                    onChange={(e) => setRejectionRemarks(e.target.value)}
                                    placeholder="Provide feedback on why this request is being rejected..."
                                    rows="4"
                                    style={{ width: "100%", padding: "12px", border: "1px solid #dcdcdc", borderRadius: "8px", resize: "none", fontSize: "14px" }}
                                    required
                                ></textarea>
                            </div>

                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Cancel
                                </button>
                                <button type="button"
                                    onClick={() => handleAction(selectedRequestId, "Rejected", rejectionRemarks)}
                                    disabled={actionLoading}
                                    style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default LeaveRequestsList;
