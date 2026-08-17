
import SettingsCard from "./SettingsCard";

const RolesPermissionsSettings = ({ data, onChange }) => {
    const modules = ["Employees", "Departments", "Attendance", "Leave", "Tasks", "Reports", "Settings"];
    const roles = ["Admin", "Manager", "Employee"];

    // Initialize permissions state if not exists
    const perms = data.permissions || {
        Admin: { Employees: true, Departments: true, Attendance: true, Leave: true, Tasks: true, Reports: true, Settings: true },
        Manager: { Employees: true, Departments: true, Attendance: true, Leave: true, Tasks: true, Reports: true, Settings: false },
        Employee: { Employees: false, Departments: false, Attendance: true, Leave: true, Tasks: true, Reports: false, Settings: false },
    };

    const handlePermChange = (role, mod) => {
        const newPerms = { ...perms };
        newPerms[role] = { ...newPerms[role], [mod]: !newPerms[role][mod] };
        onChange("permissions", newPerms);
    };

    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Roles & Permissions
            </h2>
            <SettingsCard title="Permission Matrix" description="Manage access control for different roles.">
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                        <thead>
                            <tr>
                                <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>Modules</th>
                                {roles.map(role => (
                                    <th key={role} style={{ padding: "12px", borderBottom: "2px solid #e2e8f0", color: "#475569", textAlign: "center" }}>
                                        {role}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map(mod => (
                                <tr key={mod} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "12px", color: "#334155", fontWeight: "500" }}>{mod}</td>
                                    {roles.map(role => (
                                        <td key={`${role}-${mod}`} style={{ padding: "12px", textAlign: "center" }}>
                                            <input 
                                                type="checkbox" 
                                                aria-label={`Permission for ${role} on ${mod}`}
                                                checked={perms[role][mod]} 
                                                onChange={() => handlePermChange(role, mod)}
                                                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#4f46e5" }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SettingsCard>
        </div>
    );
};

export default RolesPermissionsSettings;
