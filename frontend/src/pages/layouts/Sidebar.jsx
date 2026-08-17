import { useNavigate, useLocation } from "react-router-dom";
import { 
    FaHome, 
    FaUsers, 
    FaBuilding, 
    FaCalendarCheck, 
    FaClipboardList, 
    FaTasks, 
    FaChartBar, 
    FaCog, 
    FaSignOutAlt,
    FaUserCircle,
    FaBell,
    FaFolder,
    FaUserMinus
} from "react-icons/fa";


function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const role = user.role || "Employee";

    const adminMenuItems = [
        { name: "Dashboard", path: "/admin/dashboard", icon: <FaHome /> },
        { name: "Employees", path: "/admin/employees", icon: <FaUsers /> },
        { name: "Departments", path: "/admin/departments", icon: <FaBuilding /> },
        { name: "Attendance", path: "/admin/attendance", icon: <FaCalendarCheck /> },
        { name: "Leaves", path: "/admin/leaves", icon: <FaClipboardList /> },
        { name: "Tasks", path: "/admin/tasks", icon: <FaTasks /> },
        { name: "Projects", path: "/admin/projects", icon: <FaFolder /> },
        { name: "Resignations", path: "/admin/resignations", icon: <FaUserMinus /> },
        { name: "Reports", path: "/reports", icon: <FaChartBar /> },
        { name: "Settings", path: "/settings", icon: <FaCog /> },
    ];



    const employeeMenuItems = [
        { name: "Dashboard", path: "/employee/dashboard", icon: <FaHome /> },
        { name: "My Profile", path: "/employee/profile", icon: <FaUserCircle /> },
        { name: "Attendance", path: "/employee/attendance", icon: <FaCalendarCheck /> },
        { name: "Leave Requests", path: "/employee/leaves", icon: <FaClipboardList /> },
        { name: "My Tasks", path: "/employee/tasks", icon: <FaTasks /> },
        { name: "Projects", path: "/employee/projects", icon: <FaFolder /> },
        { name: "Reports", path: "/reports", icon: <FaChartBar /> },
        { name: "Settings", path: "/settings", icon: <FaCog /> },
    ];



    const managerMenuItems = [
        { name: "Dashboard", path: "/manager/dashboard", icon: <FaHome /> },
        { name: "My Profile", path: "/employee/profile", icon: <FaUserCircle /> },
        { name: "My Attendance", path: "/employee/attendance", icon: <FaCalendarCheck /> },
        { name: "My Leaves", path: "/employee/leaves", icon: <FaClipboardList /> },
        { name: "View Team", path: "/admin/employees", icon: <FaUsers /> },
        { name: "Team Attendance", path: "/admin/attendance", icon: <FaCalendarCheck /> },
        { name: "Team Leaves", path: "/admin/leaves", icon: <FaClipboardList /> },
        { name: "Tasks", path: "/admin/tasks", icon: <FaTasks /> },
        { name: "Projects", path: "/admin/projects", icon: <FaFolder /> },
        { name: "Reports", path: "/reports", icon: <FaChartBar /> },
        { name: "Settings", path: "/settings", icon: <FaCog /> },
    ];



    const menuItems = role === "Admin" ? adminMenuItems : role === "Manager" ? managerMenuItems : employeeMenuItems;

    return (
        <aside className="sidebar">
            <ul className="sidebar-menu" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100vh - 110px)", width: "100%" }}>
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path || 
                        (item.path !== "/admin/dashboard" && item.path !== "/employee/dashboard" && item.path !== "/settings" && item.path !== "#" && location.pathname.startsWith(item.path));
                    return (
                        <li
                            key={`key-${index}` /* fixed */}
                            className={isActive ? "active-menu" : ""}
                            onClick={() => {
                                if (item.path !== "#") {
                                    navigate(item.path);
                                }
                            }}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </li>
                    );
                })}
                <li onClick={handleLogout} style={{ marginTop: "auto", color: "#ef4444ff" }}>
                    <FaSignOutAlt style={{ color: "#ef4444ff" }} />
                    <span>Logout</span>
                </li>
            </ul>
        </aside>
    );
}

export default Sidebar;