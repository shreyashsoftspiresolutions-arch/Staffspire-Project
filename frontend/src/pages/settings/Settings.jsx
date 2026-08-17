import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";
import useSWR from "swr";
import { 
    FaCog, FaBuilding, FaUser, FaPalette, FaBell, FaClock, 
    FaShieldAlt, FaUserShield, FaPlug, FaDatabase, FaServer, 
    FaInfoCircle, FaSearch, FaSave, FaUndo 
} from "react-icons/fa";

// Import all tabs
import GeneralSettings from "./tabs/GeneralSettings";
import CompanySettings from "./tabs/CompanySettings";
import AccountSettings from "./tabs/AccountSettings";
import AppearanceSettings from "./tabs/AppearanceSettings";
import NotificationSettings from "./tabs/NotificationSettings";
import AttendanceSettings from "./tabs/AttendanceSettings";
import SecuritySettings from "./tabs/SecuritySettings";
import RolesPermissionsSettings from "./tabs/RolesPermissionsSettings";
import IntegrationsSettings from "./tabs/IntegrationsSettings";
import DataBackupSettings from "./tabs/DataBackupSettings";
import SystemSettings from "./tabs/SystemSettings";
import AboutSettings from "./tabs/AboutSettings";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

function Settings() {
    
    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const isAdmin = user.role === "Admin";

    const allTabs = [
        { id: "general", label: "General", icon: <FaCog />, component: GeneralSettings, adminOnly: false },
        { id: "company", label: "Company", icon: <FaBuilding />, component: CompanySettings, adminOnly: true },
        { id: "account", label: "Account", icon: <FaUser />, component: AccountSettings, adminOnly: false },
        { id: "appearance", label: "Appearance", icon: <FaPalette />, component: AppearanceSettings, adminOnly: false },
        { id: "notifications", label: "Notifications", icon: <FaBell />, component: NotificationSettings, adminOnly: false },
        { id: "attendance", label: "Attendance", icon: <FaClock />, component: AttendanceSettings, adminOnly: true },
        { id: "security", label: "Security", icon: <FaShieldAlt />, component: SecuritySettings, adminOnly: true },
        { id: "roles", label: "Roles & Permissions", icon: <FaUserShield />, component: RolesPermissionsSettings, adminOnly: true },
        { id: "integrations", label: "Integrations", icon: <FaPlug />, component: IntegrationsSettings, adminOnly: false },
        { id: "data", label: "Data & Backup", icon: <FaDatabase />, component: DataBackupSettings, adminOnly: true },
        { id: "system", label: "System", icon: <FaServer />, component: SystemSettings, adminOnly: true },
        { id: "about", label: "About", icon: <FaInfoCircle />, component: AboutSettings, adminOnly: false },
    ];

    const availableTabs = allTabs.filter(tab => !tab.adminOnly || isAdmin);

    const [activeTab, setActiveTab] = useState(availableTabs[0].id);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [settingsData, setSettingsData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const showNotification = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };


    const { data: officeData, isLoading: isOfficeLoading } = useSWR(isAdmin ? "http://localhost:5000/api/office-settings" : null, fetcher);

    // Load initial data (mocking API call for most, using actual API for geofencing if admin)
    useEffect(() => {
        if (isAdmin && isOfficeLoading) return; // Wait for data if admin
        
        let initialData = {};
        // Mock fetching from API / LocalStorage for other settings
        const userKey = user.email || user.id || user._id || "default";
        const savedSettings = JSON.parse(localStorage.getItem(`staffspire_settings:v1:${userKey}`)) || JSON.parse(localStorage.getItem("staffspire_settings:v1")) || {};
        initialData = { ...initialData, ...savedSettings };

        if (isAdmin && officeData?.data) {
            const office = officeData.data;
            initialData.officeName = office.office_name;
            initialData.latitude = office.latitude;
            initialData.longitude = office.longitude;
            initialData.attendance_radius = office.attendance_radius;
        }

        setSettingsData(initialData);
        setOriginalData(initialData);
        setIsDirty(false);
    }, [isAdmin, officeData, isOfficeLoading]);

    const handleSettingChange = (key, value) => {
        setSettingsData(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            // Save non-geofence settings locally for now
            const userKey = user.email || user.id || user._id || "default";
            localStorage.setItem(`staffspire_settings:v1:${userKey}`, JSON.stringify(settingsData));

            if (isAdmin && (settingsData.officeName || settingsData.latitude)) {
                const token = localStorage.getItem("token");
                await axios.post(
                    "http://localhost:5000/api/office-settings",
                    {
                        office_name: settingsData.officeName,
                        latitude: parseFloat(settingsData.latitude),
                        longitude: parseFloat(settingsData.longitude),
                        attendance_radius: parseFloat(settingsData.attendance_radius)
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            setOriginalData(settingsData);
            setIsDirty(false);
            showNotification("success", "Settings saved successfully.");
            
            // Reload the page after a short delay so the layout theme applies immediately
            setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch (error) {
            console.error("Failed to save settings:", error);
            showNotification("error", "Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        setSettingsData(originalData);
        setIsDirty(false);
    };

    const handleTabChange = (tabId) => {
        if (isDirty) {
            const confirmLeave = window.confirm("You have unsaved changes. Do you want to discard them?");
            if (!confirmLeave) return;
            handleDiscard();
        }
        setActiveTab(tabId);
        setSearchQuery(""); // Clear search when switching tabs manually
    };

    const filteredTabs = availableTabs.filter(tab => tab.label.toLowerCase().includes(searchQuery.toLowerCase()));

    const ActiveComponent = availableTabs.find(t => t.id === activeTab)?.component;

    return (
        <DashboardLayout>
            <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px", boxSizing: "border-box" }}>
                
                {/* Header Section */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#0f172a", fontWeight: "bold" }}>Settings</h1>
                        <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.95rem" }}>Manage your StaffSpire configurations and preferences.</p>
                    </div>
                    {isDirty && (
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button type="button" 
                                className="btn-settings-discard"
                                onClick={handleDiscard}
                                style={{
                                    display: "flex", alignItems: "center", gap: "8px",
                                    padding: "10px 16px", backgroundColor: "#fff", border: "1px solid #cbd5e1",
                                    borderRadius: "8px", color: "#475569", fontWeight: "600", cursor: "pointer"
                                }}
                            >
                                <FaUndo /> Discard
                            </button>
                            <button type="button" 
                                className="btn-settings-save"
                                onClick={handleSave}
                                style={{
                                    display: "flex", alignItems: "center", gap: "8px",
                                    padding: "10px 16px", backgroundColor: "#4f46e5", border: "none",
                                    borderRadius: "8px", color: "white", fontWeight: "600", cursor: "pointer",
                                    boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
                                }}
                            >
                                <FaSave /> Save Changes
                            </button>
                        </div>
                    )}
                </div>

                {message && (
                    <div style={{ 
                        padding: "12px 16px", 
                        borderRadius: "8px", 
                        marginBottom: "20px",
                        backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                        color: message.type === 'success' ? '#166534' : '#991b1b',
                        border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Main Settings Area */}
                <div style={{ display: "flex", gap: "32px", flex: 1, minHeight: 0 }}>
                    
                    {/* Sidebar */}
                    <div style={{ 
                        width: "280px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "16px",
                        backgroundColor: "white",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                        border: "1px solid #e2e8f0"
                    }}>
                        {/* Search */}
                        <div style={{ position: "relative" }}>
                            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                            <input 
                                type="text"
                                aria-label="Search settings"
                                placeholder="Search settings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%", padding: "10px 12px 10px 36px",
                                    borderRadius: "8px", border: "1px solid #cbd5e1",
                                    fontSize: "0.9rem", color: "#334155",
                                    backgroundColor: "#f8fafc"
                                }}
                            />
                        </div>

                        {/* Navigation List */}
                        <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                                {filteredTabs.map(tab => (
                                    <li key={tab.id}>
                                        <button type="button"
                                            className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                            onClick={() => handleTabChange(tab.id)}
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "12px 16px",
                                                border: "none",
                                                borderRadius: "8px",
                                                backgroundColor: activeTab === tab.id ? "#e0e7ff" : "transparent",
                                                color: activeTab === tab.id ? "#4f46e5" : "#475569",
                                                fontWeight: activeTab === tab.id ? "600" : "500",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (activeTab !== tab.id) {
                                                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (activeTab !== tab.id) {
                                                    e.currentTarget.style.backgroundColor = "transparent";
                                                }
                                            }}
                                        >
                                            <span style={{ fontSize: "1.1rem" }}>{tab.icon}</span>
                                            {tab.label}
                                        </button>
                                    </li>
                                ))}
                                {filteredTabs.length === 0 && (
                                    <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: "0.9rem" }}>
                                        No categories found.
                                    </div>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1, overflowY: "auto", paddingRight: "10px" }}>
                        {ActiveComponent ? (
                            <ActiveComponent data={settingsData} onChange={handleSettingChange} user={user} />
                        ) : (
                            <div>Select a category</div>
                        )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

export default Settings;