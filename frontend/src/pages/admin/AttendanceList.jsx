import { useEffect, useState } from "react";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaSearch, FaCalendarAlt, FaHistory, FaCheckCircle, FaUserClock } from "react-icons/fa";
import CustomConfirmModal from "../../components/CustomConfirmModal";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);


function AttendanceList() {
    const loggedInUser = JSON.parse(localStorage.getItem("user:v1")) || {};
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    // Custom confirm modal state
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, employeeId: null, attendanceDate: null, employeeName: "" });



    const { data: attData, isLoading: attLoading, mutate: fetchAttendance } = useSWR("http://localhost:5000/api/attendance", fetcher);

    useEffect(() => {
        setLoading(attLoading && !attData);
        if (attData) {
            setAttendance(attData.attendance || []);
        }
    }, [attData, attLoading]);

    const handleForceCheckOutClick = (employeeId, attendanceDate, firstName, lastName) => {
        const fullName = `${firstName || ""} ${lastName || ""}`.trim() || employeeId;
        setConfirmModal({ isOpen: true, employeeId, attendanceDate, employeeName: fullName });
    };

    const handleConfirmForceCheckOut = async () => {
        const { employeeId, attendanceDate } = confirmModal;
        try {
            const token = localStorage.getItem("token");
            const recordDateStr = new Date(attendanceDate).toLocaleDateString("sv"); // Sweden format YYYY-MM-DD
            await axios.post(
                "http://localhost:5000/api/attendance/admin/check-out",
                { employeeId, attendanceDate: recordDateStr },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchAttendance();
        } catch (error) {
            console.error("Force check-out error:", error);
            alert(error.response?.data?.message || "Failed to force check-out.");
        } finally {
            setConfirmModal({ isOpen: false, employeeId: null, attendanceDate: null, employeeName: "" });
        }
    };


    const getInitials = (firstName, lastName) => {
        const f = firstName ? firstName.charAt(0).toUpperCase() : "";
        const l = lastName ? lastName.charAt(0).toUpperCase() : "";
        return `${f}${l}` || "EE";
    };

    const formatTime12h = (timeStr) => {
        if (!timeStr) return "--:--";
        try {
            const [hours, minutes] = timeStr.split(":");
            let h = parseInt(hours);
            const ampm = h >= 12 ? "PM" : "AM";
            h = h % 12 || 12;
            return `${String(h).padStart(2, "0")}:${minutes} ${ampm}`;
        } catch (e) {
            return timeStr;
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
            case "Present": return "badge-present";
            case "Late": return "badge-late";
            case "Half Day": return "badge-halfday";
            case "Absent": return "badge-absent";
            default: return "badge-neutral";
        }
    };

    const filteredAttendance = attendance.filter((record) => {
        const fullName = `${record.first_name || ""} ${record.last_name || ""}`.toLowerCase();
        const empId = (record.employee_id || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        
        const matchesQuery = fullName.includes(query) || empId.includes(query);
        
        let matchesDate = true;
        if (dateFilter) {
            const recordDateStr = new Date(record.attendance_date).toLocaleDateString("sv"); // YYYY-MM-DD
            matchesDate = recordDateStr === dateFilter;
        }

        return matchesQuery && matchesDate;
    });

    // Compute basic summary stats for header overview cards
    const totalRecords = filteredAttendance.length;
    const presentCount = filteredAttendance.filter(r => r.status === "Present").length;
    const lateCount = filteredAttendance.filter(r => r.status === "Late").length;
    const halfDayCount = filteredAttendance.filter(r => r.status === "Half Day").length;

    const getLocationStatusClass = (locStatus) => {
        if (locStatus === "Inside Office") return "badge-present"; // green
        if (locStatus === "Outside Office") return "badge-absent"; // red
        return "badge-neutral";
    };

    return (
        <DashboardLayout>
            <div className="attendance-page-container">
                <div className="employee-header" style={{ marginBottom: "24px" }}>
                    <h1 className="page-title" style={{ margin: 0 }}>Attendance Registry</h1>
                </div>

                {/* Stat Overview Cards */}
                <div className="admin-stats-grid">
                    <div className="attendance-card stat-metric-card">
                        <div className="stat-meta">
                            <span className="stat-label">Total Logs</span>
                            <FaHistory className="stat-icon" style={{ color: "#3b82f6" }} />
                        </div>
                        <div className="stat-val">{totalRecords}</div>
                    </div>
                    <div className="attendance-card stat-metric-card">
                        <div className="stat-meta">
                            <span className="stat-label">On Time</span>
                            <FaCheckCircle className="stat-icon" style={{ color: "#22c55e" }} />
                        </div>
                        <div className="stat-val">{presentCount}</div>
                    </div>
                    <div className="attendance-card stat-metric-card">
                        <div className="stat-meta">
                            <span className="stat-label">Late Arrivals</span>
                            <FaUserClock className="stat-icon" style={{ color: "#f59e0b" }} />
                        </div>
                        <div className="stat-val">{lateCount}</div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="filters-card">
                    <div className="search-box">
                        <FaSearch className="filter-icon" />
                        <input
                            type="text"
                            placeholder="Search employee name or ID..."
                            aria-label="Search employee name or ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="date-filter-box">
                        <FaCalendarAlt className="filter-icon" />
                        <input
                            type="date"
                            aria-label="Filter by date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                        {dateFilter && (
                            <button type="button" className="clear-date-btn" onClick={() => setDateFilter("")}>
                                Clear Date
                            </button>
                        )}
                    </div>
                </div>

                {/* Logs Table */}
                <div className="table-container-custom">
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Emp ID</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Date</th>
                                <th>Check-In</th>
                                <th>Check-Out</th>
                                <th>Working Hours</th>
                                <th>Status</th>
                                <th style={{ textAlign: "center" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="12" style={{ textAlign: "center", color: "#64748b" }}>
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : filteredAttendance.length === 0 ? (
                                <tr>
                                    <td colSpan="12" style={{ textAlign: "center", color: "#64748b" }}>
                                        No attendance logs matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredAttendance.map((record) => (
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
                                        <td style={{ fontWeight: "500" }}>{formatDateNice(record.attendance_date)}</td>
                                        <td>{formatTime12h(record.check_in)}</td>
                                        <td>{record.check_out ? formatTime12h(record.check_out) : "--:--"}</td>
                                        <td style={{ fontFamily: "monospace" }}>{record.working_hours || "--:--"}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {record.email === loggedInUser.email ? (
                                                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: "500" }}>Self</span>
                                            ) : record.status === "Absent" ? (
                                                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: "500" }}>--</span>
                                            ) : !record.check_out ? (
                                                <button type="button"
                                                    onClick={() => handleForceCheckOutClick(record.employee_id, record.attendance_date, record.first_name, record.last_name)}
                                                    style={{
                                                        background: "#fee2e2",
                                                        color: "#dc2626",
                                                        border: "1px solid #fecaca",
                                                        padding: "6px 12px",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        transition: "all 0.15s ease"
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background="#dc2626"; e.currentTarget.style.color="white"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.color="#dc2626"; }}
                                                >
                                                    Force Check-out
                                                </button>
                                            ) : (
                                                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: "600" }}>Checked Out</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <CustomConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, employeeId: null, attendanceDate: null, employeeName: "" })}
                onConfirm={handleConfirmForceCheckOut}
                title="Force Check-out"
                message={`Are you sure you want to force check-out ${confirmModal.employeeName}? This will end their working session for today.`}
                confirmText="Force Check-out"
                cancelText="Cancel"
                type="warning"
            />
        </DashboardLayout>
    );
}

export default AttendanceList;
