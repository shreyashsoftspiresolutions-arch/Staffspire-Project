
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";

const DataBackupSettings = () => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Data & Backup
            </h2>
            <SettingsCard title="Database Information" description="Current status of your application data.">
                
                <SettingRow label="Database Status">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: "500", fontSize: "0.9rem" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a" }} /> Connected
                    </span>
                </SettingRow>

                <SettingRow label="Storage Usage">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "120px", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: "45%", height: "100%", backgroundColor: "#3b82f6" }} />
                        </div>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>45% (2.1 GB / 5 GB)</span>
                    </div>
                </SettingRow>

                <SettingRow label="Last Backup">
                    <span style={{ fontSize: "0.9rem", color: "#334155" }}>Today, 03:00 AM (Auto)</span>
                </SettingRow>
            </SettingsCard>

            <SettingsCard title="Backup & Restore" description="Manually manage your data backups.">
                
                <SettingRow label="Manual Backup" description="Create a new backup immediately.">
                    <button type="button" style={buttonStyle}>Run Backup Now</button>
                </SettingRow>

                <SettingRow label="Export Database" description="Download a copy of the database.">
                    <button type="button" style={buttonStyle}>Export (.sql)</button>
                </SettingRow>

                <SettingRow label="Import Data" description="Restore data from a backup file.">
                    <button type="button" style={{ ...buttonStyle, backgroundColor: "#fff", borderColor: "#e2e8f0" }}>Import Data</button>
                </SettingRow>

                <SettingRow label="Reset Demo Data" description="Clear all data and reset to defaults.">
                    <button type="button" style={{ ...buttonStyle, backgroundColor: "#fee2e2", color: "#ef4444", borderColor: "#fca5a5" }}>Reset Data</button>
                </SettingRow>

            </SettingsCard>
        </div>
    );
};

const buttonStyle = {
    padding: "6px 12px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "0.85rem",
    color: "#334155",
    cursor: "pointer",
    fontWeight: "500"
};

export default DataBackupSettings;
