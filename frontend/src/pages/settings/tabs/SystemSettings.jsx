
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";

const SystemSettings = () => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                System Status
            </h2>
            <SettingsCard title="System Information" description="Overview of platform health and version.">
                
                <SettingRow label="StaffSpire Version">
                    <span style={{ fontSize: "0.95rem", color: "#334155", fontWeight: "500" }}>v1.5.0</span>
                </SettingRow>

                <SettingRow label="Environment">
                    <span style={{ fontSize: "0.85rem", padding: "4px 8px", backgroundColor: "#e0e7ff", color: "#4f46e5", borderRadius: "4px", fontWeight: "600" }}>Production</span>
                </SettingRow>

                <SettingRow label="Server Status">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: "500", fontSize: "0.9rem" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a" }} /> Operational
                    </span>
                </SettingRow>

                <SettingRow label="API Status">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: "500", fontSize: "0.9rem" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a" }} /> Operational
                    </span>
                </SettingRow>

            </SettingsCard>
        </div>
    );
};

export default SystemSettings;
