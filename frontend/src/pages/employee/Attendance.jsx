import { useEffect, useReducer } from "react";
import axios from "axios";
import useSWR from "swr";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaClock, FaSignInAlt, FaSignOutAlt, FaCalendarCheck, FaHourglassHalf, FaCalendarDay } from "react-icons/fa";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

const attendanceReducer = (state, action) => {
    switch (action.type) {
        case "UPDATE_DATA": return { ...state, ...action.payload };
        case "SET_LOADING": return { ...state, loading: action.value };
        case "SET_ACTION_LOADING": return { ...state, actionLoading: action.value };
        case "SET_MESSAGE": return { ...state, message: action.payload };
        case "TICK_CLOCK": return { ...state, currentTime: action.value };
        default: return state;
    }
};

function Attendance() {
    const [state, dispatch] = useReducer(attendanceReducer, {
        todayRecord: null, history: [], loading: true, actionLoading: false, message: null,
        isCheckInAllowed: true, isCheckOutAllowed: false, checkInBlockReason: "",
        todayStatusLabel: "Absent", currentTime: new Date()
    });
    const { todayRecord, history, loading, actionLoading, message, isCheckInAllowed, isCheckOutAllowed, checkInBlockReason, todayStatusLabel, currentTime } = state;

    // Live clock update
    useEffect(() => {
        const timer = setInterval(() => {
            dispatch({ type: "TICK_CLOCK", value: new Date() });
        }, 1000);
        return () => clearInterval(timer);
    }, []);


    const { data: todayData, isLoading: todayLoading, mutate: mutateToday } = useSWR("http://localhost:5000/api/attendance/today", fetcher);
    const { data: historyData, isLoading: historyLoading, mutate: mutateHistory } = useSWR("http://localhost:5000/api/attendance/history", fetcher);

    useEffect(() => {
        dispatch({ type: "SET_LOADING", value: (todayLoading && !todayData) || (historyLoading && !historyData) });
        if (todayData) {
            dispatch({
                type: "UPDATE_DATA",
                payload: {
                    todayRecord: todayData.attendance,
                    isCheckInAllowed: todayData.isCheckInAllowed !== false,
                    isCheckOutAllowed: !!todayData.isCheckOutAllowed,
                    checkInBlockReason: todayData.checkInBlockReason || "",
                    todayStatusLabel: todayData.todayStatusLabel || "Absent"
                }
            });
        }
        if (historyData) {
            dispatch({ type: "UPDATE_DATA", payload: { history: historyData.history || [] } });
        }
    }, [todayData, historyData, todayLoading, historyLoading]);

    const fetchAttendanceData = () => {
        mutateToday();
        mutateHistory();
    };

    const showNotification = (type, text) => {
        dispatch({ type: "SET_MESSAGE", payload: { type, text } });
        setTimeout(() => dispatch({ type: "SET_MESSAGE", payload: null }), 5000);
    };

    // ── LIVE LOCATION TEMPORARILY DISABLED ──────────────────────────────────
    // const getCoordinates = () => {
    //     return new Promise((resolve, reject) => {
    //         if (!navigator.geolocation) {
    //             reject(new Error("Geolocation is not supported by your browser."));
    //             return;
    //         }
    //         navigator.geolocation.getCurrentPosition(
    //             (position) => {
    //                 resolve({
    //                     latitude: position.coords.latitude,
    //                     longitude: position.coords.longitude,
    //                     accuracy: position.coords.accuracy
    //                 });
    //             },
    //             (error) => {
    //                 let errMsg = "Failed to retrieve location.";
    //                 if (error.code === error.PERMISSION_DENIED) {
    //                     errMsg = "Location permission is required to mark attendance.";
    //                 } else if (error.code === error.POSITION_UNAVAILABLE) {
    //                     errMsg = "Location information is unavailable.";
    //                 } else if (error.code === error.TIMEOUT) {
    //                     errMsg = "Request to get location timed out.";
    //                 }
    //                 reject(new Error(errMsg));
    //             },
    //             { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    //         );
    //     });
    // };
    // ────────────────────────────────────────────────────────────────────────

    const handleCheckIn = async () => {
        try {
            dispatch({ type: "SET_ACTION_LOADING", value: true });

            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/api/attendance/check-in",
                {}, // no location payload
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showNotification("success", response.data.message || "Checked in successfully!");
            fetchAttendanceData();
        } catch (error) {
            console.error("Check-in error:", error);
            showNotification(
                "error",
                error.response?.data?.message || "Check-in failed. Please try again."
            );
        } finally {
            dispatch({ type: "SET_ACTION_LOADING", value: false });
        }
    };

    const handleCheckOut = async () => {
        try {
            dispatch({ type: "SET_ACTION_LOADING", value: true });

            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/api/attendance/check-out",
                {}, // no location payload
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showNotification("success", response.data.message || "Checked out successfully!");
            fetchAttendanceData();
        } catch (error) {
            console.error("Check-out error:", error);
            showNotification(
                "error",
                error.response?.data?.message || "Check-out failed. Please try again."
            );
        } finally {
            dispatch({ type: "SET_ACTION_LOADING", value: false });
        }
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
            case "Weekly Off":
            case "Holiday":
            case "On Leave":
                return "badge-neutral";
            default: return "badge-neutral";
        }
    };

    return (
        <DashboardLayout>
            <div className="attendance-page-container">
                <div className="employee-header" style={{ marginBottom: "24px" }}>
                    <h1 className="page-title" style={{ margin: 0 }}>Attendance Dashboard</h1>
                </div>

                {message && (
                    <div className={`alert-banner alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="attendance-grid">
                    {/* Live Clock & Action Panel */}
                    <div className="attendance-card clock-panel-card">
                        <div className="card-header">
                            <FaClock className="panel-icon" />
                            <h3>Live Clocking</h3>
                        </div>
                        <div className="clock-display">
                            <div className="time">{currentTime.toLocaleTimeString()}</div>
                            <div className="date">
                                {currentTime.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                })}
                            </div>
                        </div>

                        <div className="action-buttons" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                            <div style={{ display: "flex", gap: "16px", width: "100%" }}>
                                <button type="button"
                                    className="check-btn check-in-btn"
                                    onClick={handleCheckIn}
                                    disabled={loading || actionLoading || !isCheckInAllowed}
                                    style={{ flex: 1 }}
                                >
                                    <FaSignInAlt /> Check In
                                </button>
                                <button type="button"
                                    className="check-btn check-out-btn"
                                    onClick={handleCheckOut}
                                    disabled={loading || actionLoading || !isCheckOutAllowed}
                                    style={{ flex: 1 }}
                                >
                                    <FaSignOutAlt /> Check Out
                                </button>
                            </div>
                            {!todayRecord && checkInBlockReason && (
                                <p style={{ color: "#ef4444", fontSize: "13.5px", fontWeight: "600", textAlign: "center", margin: "4px 0 0 0" }}>
                                    ⚠️ {checkInBlockReason}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Today's Status Cards */}
                    <div className="status-overview">
                        <div className="summary-card-row">
                            <div className="attendance-card mini-summary-card">
                                <div className="card-meta">
                                    <span className="card-title">Today's Status</span>
                                    <FaCalendarDay className="card-metric-icon" />
                                </div>
                                <div className="card-val">
                                    <span className={`status-badge ${getStatusClass(todayRecord ? todayRecord.status : todayStatusLabel)}`}>
                                        {todayRecord ? todayRecord.status : todayStatusLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="attendance-card mini-summary-card">
                                <div className="card-meta">
                                    <span className="card-title">Check-in Time</span>
                                    <FaSignInAlt className="card-metric-icon check-in-col" />
                                </div>
                                <div className="card-val">
                                    {todayRecord?.check_in ? formatTime12h(todayRecord.check_in) : "--:--"}
                                </div>
                            </div>
                        </div>

                        <div className="summary-card-row">
                            <div className="attendance-card mini-summary-card">
                                <div className="card-meta">
                                    <span className="card-title">Check-out Time</span>
                                    <FaSignOutAlt className="card-metric-icon check-out-col" />
                                </div>
                                <div className="card-val">
                                    {todayRecord?.check_out ? formatTime12h(todayRecord.check_out) : "--:--"}
                                </div>
                            </div>

                            <div className="attendance-card mini-summary-card">
                                <div className="card-meta">
                                    <span className="card-title">Working Hours</span>
                                    <FaHourglassHalf className="card-metric-icon hours-col" />
                                </div>
                                <div className="card-val">
                                    {todayRecord?.working_hours || "00:00:00"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="history-section">
                    <h2>Attendance History</h2>
                    <div className="table-container-custom">
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Check-In</th>
                                    <th>Check-Out</th>
                                    <th>Working Hours</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>
                                            Loading logs...
                                        </td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>
                                            No logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((record) => (
                                        <tr key={record.id}>
                                            <td style={{ fontWeight: "600" }}>
                                                {formatDateNice(record.attendance_date)}
                                            </td>
                                            <td>{formatTime12h(record.check_in)}</td>
                                            <td>{record.check_out ? formatTime12h(record.check_out) : "--:--"}</td>
                                            <td style={{ fontFamily: "monospace", fontSize: "14px" }}>
                                                {record.working_hours || "--:--"}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default Attendance;
