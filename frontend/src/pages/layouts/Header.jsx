import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import useSWR from "swr";
import {
    FaBell,
    FaCog,
    FaUserCircle,
    FaSearch,
    FaSignOutAlt,
    FaChevronDown,
    FaCheckCircle,
    FaCalendarTimes,
    FaBirthdayCake,
    FaKey,
    FaPlus,
    FaUserPlus,
    FaTasks
} from "react-icons/fa";
import profilePic from "../../assets/Softspire_Logo.png";
import "../../styles/header.css";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifMenu, setShowNotifMenu] = useState(false);
    const [showQuickMenu, setShowQuickMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isClearing, setIsClearing] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);

    const user = JSON.parse(localStorage.getItem("user:v1")) || { name: "Shreyash", role: "Admin" };
    const token = localStorage.getItem("token");


    const { data: notifData } = useSWR(token ? "http://localhost:5000/api/notifications" : null, fetcher, { refreshInterval: 15000 });

    useEffect(() => {
        if (notifData && notifData.success) {
            setNotifications(notifData.notifications);
        }
    }, [notifData]);

    const handleClearAll = async () => {
        if (!token || isClearing) return;
        setIsClearing(true);
        try {
            await axios.put("http://localhost:5000/api/notifications/read-all", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications([]);
        } catch (error) {
            console.error("Error clearing notifications:", error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        if (!token || isMarkingRead) return;
        setIsMarkingRead(true);
        try {
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        } finally {
            setIsMarkingRead(false);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getNotifDetails = (title) => {
        const lower = title.toLowerCase();
        if (lower.includes("task")) {
            return {
                icon: <FaCheckCircle style={{ color: "#3b82f6" }} />,
                bg: "#dbeafe"
            };
        }
        if (lower.includes("leave")) {
            return {
                icon: <FaCalendarTimes style={{ color: "#ef4444" }} />,
                bg: "#fee2e2"
            };
        }
        return {
            icon: <FaCheckCircle style={{ color: "#22c55e" }} />,
            bg: "#d1fae5"
        };
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // Dynamically set title based on the active path
    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes("/dashboard")) return "Dashboard";
        if (path.includes("/admin/employees")) return "Employee List";
        if (/\d+/.test(path) && path.includes("/admin/departments")) return "Department Profile";
        if (path.includes("/admin/departments")) return "Departments";
        if (path.includes("/admin/attendance")) return "Attendance Registry";
        if (path.includes("/employee/attendance")) return "Attendance Dashboard";
        if (/\/admin\/leaves\/\d+/.test(path)) return "Leave Request Details";
        if (path.includes("/admin/leaves")) return "Leave Requests Registry";
        if (path.includes("/employee/leaves")) return "My Leave Dashboard";
        if (/\/admin\/tasks\/\d+/.test(path)) return "Task Details";
        if (/\/employee\/tasks\/\d+/.test(path)) return "Task Details";
        if (path.includes("/admin/tasks")) return "Task Management";
        if (path.includes("/employee/tasks")) return "My Tasks";
        if (path.includes("/settings")) return "Settings";
        if (path.includes("/reports")) return "Centralized Reports";
        if (path.includes("/change-password")) return "Change Password";
        return "Employee Management System";
    };

    return (
        <header className="header-premium">
            {/* Left Brand and Title */}
            <div className="header-left-premium">
                <div onClick={() => navigate(user.role === "Admin" ? "/admin/dashboard" : "/employee/dashboard")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <img className="brand-logo-premium" src={profilePic} alt="StaffSpire Logo" style={{ height: '58px', marginLeft: '-24px', objectFit: 'contain' }} />
                </div>
                <div className="header-divider-premium"></div>
                <h2 className="header-title-premium">{getPageTitle()}</h2>
            </div>

            {/* Right Side Actions */}
            <div className="header-right-premium" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                
                {/* Global Search */}
                <div className="header-search-container" style={{ position: "relative", marginRight: "8px", display: "none", '@media (minWidth: 768px)': { display: 'block' } }}>
                    <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        style={{
                            padding: "10px 12px 10px 36px",
                            borderRadius: "20px",
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#f8fafc",
                            outline: "none",
                            width: "220px",
                            fontSize: "14px",
                            transition: "all 0.3s ease"
                        }}
                        onFocus={(e) => {
                            e.target.style.boxShadow = "0 0 0 2px rgba(79, 70, 229, 0.2)";
                            e.target.style.width = "260px";
                        }}
                        onBlur={(e) => {
                            e.target.style.boxShadow = "none";
                            e.target.style.width = "220px";
                        }}
                    />
                </div>

                {/* Quick Actions (+) */}
                <div style={{ position: "relative" }}>
                    <button type="button"
                        className="action-btn-premium"
                        aria-label="Quick Actions"
                        style={{ background: "var(--primary, #4f46e5)", color: "white", border: "none" }}
                        onClick={() => {
                            setShowQuickMenu(!showQuickMenu);
                            setShowNotifMenu(false);
                            setShowProfileMenu(false);
                        }}
                    >
                        <FaPlus />
                    </button>

                    {showQuickMenu && (
                        <div className="dropdown-menu-premium" style={{ width: "200px", top: "50px", right: "0" }}>
                            <div className="dropdown-header-premium flex-header">
                                <h4>Quick Actions</h4>
                            </div>
                            <div className="profile-menu-items">
                                {user.role === "Admin" && (
                                    <div className="profile-menu-item" onClick={() => { navigate("/admin/employees"); setShowQuickMenu(false); }}>
                                        <FaUserPlus /> Add Employee
                                    </div>
                                )}
                                <div className="profile-menu-item" onClick={() => { navigate(user.role === "Admin" ? "/admin/tasks" : "/employee/tasks"); setShowQuickMenu(false); }}>
                                    <FaTasks /> Assign Task
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications Bell */}
                <div style={{ position: "relative" }}>
                    <button type="button"
                        className="action-btn-premium"
                        aria-label="Notifications"
                        onClick={() => {
                            setShowNotifMenu(!showNotifMenu);
                            setShowProfileMenu(false);
                            setShowQuickMenu(false);
                        }}
                    >
                        <FaBell />
                        {notifications.filter(n => !n.is_read).length > 0 && (
                            <span className="badge-count-premium">
                                {notifications.filter(n => !n.is_read).length > 9 ? '9+' : notifications.filter(n => !n.is_read).length}
                            </span>
                        )}
                    </button>

                    {showNotifMenu && (
                        <div className="dropdown-menu-premium">
                            <div className="dropdown-header-premium flex-header">
                                <h4>Notifications</h4>
                                <span className="dropdown-action-link" onClick={handleClearAll}>Clear All</span>
                            </div>
                            <div className="notif-list-premium">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty-premium">No new notifications</div>
                                ) : (
                                    notifications.map((n) => {
                                        const details = getNotifDetails(n.title);
                                        return (
                                            <div
                                                key={n.id}
                                                className={`notif-item-premium ${!n.is_read ? 'unread' : ''}`}
                                                onClick={() => handleMarkAsRead(n.id)}
                                            >
                                                <div className="notif-icon-premium" style={{ background: details.bg, color: details.icon.props.style.color }}>
                                                    {details.icon}
                                                </div>
                                                <div className="notif-content-premium">
                                                    <strong className="notif-title-premium">{n.title}</strong>
                                                    <span className="notif-text-premium">{n.message}</span>
                                                    <span className="notif-time-premium">{formatTime(n.created_at)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Cog */}
                    <button type="button"
                        className="action-btn-premium settings-btn"
                        aria-label="Settings"
                        onClick={() => {
                            navigate("/settings");
                            setShowNotifMenu(false);
                            setShowProfileMenu(false);
                            setShowQuickMenu(false);
                        }}
                    >
                    <FaCog />
                </button>

                {/* Profile Widget Dropdown */}
                <div style={{ position: "relative" }}>
                    <div
                        className="profile-widget-premium"
                        onClick={() => {
                            setShowProfileMenu(!showProfileMenu);
                            setShowNotifMenu(false);
                            setShowQuickMenu(false);
                        }}
                    >
                        <div className="profile-avatar-premium">
                            {user.name ? user.name.charAt(0).toUpperCase() : <FaUserCircle />}
                        </div>
                        <div className="profile-info-premium">
                            <span className="profile-name-premium">{user.name}</span>
                            <span className="profile-role-premium">{user.role}</span>
                        </div>
                        <FaChevronDown className="profile-chevron-premium" style={{ transform: showProfileMenu ? "rotate(180deg)" : "rotate(0)" }} />
                    </div>

                    {showProfileMenu && (
                        <div className="dropdown-menu-premium profile-dropdown">
                            <div className="dropdown-header-premium">
                                <h4>{user.name}</h4>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{user.email || user.role}</div>
                            </div>
                            
                            <div className="profile-menu-items">
                                <div className="profile-menu-item" onClick={() => { navigate("/employee/profile"); setShowProfileMenu(false); }}>
                                    <FaUserCircle /> My Profile
                                </div>
                                <div className="profile-menu-item" onClick={() => { navigate("/settings"); setShowProfileMenu(false); }}>
                                    <FaCog /> Settings
                                </div>
                                <div className="profile-menu-item" onClick={() => { navigate("/change-password"); setShowProfileMenu(false); }}>
                                    <FaKey /> Change Password
                                </div>
                                
                                <div style={{ height: '1px', background: 'rgba(226, 232, 240, 0.6)', margin: '8px 0' }}></div>
                                
                                <div className="profile-menu-item danger-item" onClick={handleLogout}>
                                    <FaSignOutAlt /> Logout
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
