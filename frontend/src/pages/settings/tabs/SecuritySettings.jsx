
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";

const SecuritySettings = ({ data, onChange }) => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Security Settings
            </h2>
            <SettingsCard title="Authentication Policies" description="Manage password rules and session limits.">
                
                <SettingRow label="JWT Expiration (Hours)">
                    <input 
                        type="number" 
                        aria-label="JWT Expiration"
                        value={data.jwtExpiration || "24"} 
                        onChange={(e) => onChange("jwtExpiration", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Minimum Password Length">
                    <input 
                        type="number" 
                        aria-label="Minimum Password Length"
                        value={data.minPasswordLength || "8"} 
                        onChange={(e) => onChange("minPasswordLength", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Password Requirements">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", fontSize: "0.9rem" }}>
                        <label style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <input type="checkbox" checked={data.requireNumbers ?? true} onChange={(e) => onChange("requireNumbers", e.target.checked)} /> Require Numbers
                        </label>
                        <label style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <input type="checkbox" checked={data.requireSymbols ?? true} onChange={(e) => onChange("requireSymbols", e.target.checked)} /> Require Symbols
                        </label>
                        <label style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <input type="checkbox" checked={data.requireUppercase ?? true} onChange={(e) => onChange("requireUppercase", e.target.checked)} /> Require Uppercase
                        </label>
                    </div>
                </SettingRow>

                <SettingRow label="Maximum Login Attempts" description="Lock account after X failed attempts.">
                    <input 
                        type="number" 
                        aria-label="Maximum Login Attempts"
                        value={data.maxLoginAttempts || "5"} 
                        onChange={(e) => onChange("maxLoginAttempts", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Session Timeout (Minutes)" description="Log user out after inactivity.">
                    <input 
                        type="number" 
                        aria-label="Session Timeout"
                        value={data.sessionTimeout || "60"} 
                        onChange={(e) => onChange("sessionTimeout", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="OTP Expiration (Minutes)">
                    <input 
                        type="number" 
                        aria-label="OTP Expiration"
                        value={data.otpExpiration || "10"} 
                        onChange={(e) => onChange("otpExpiration", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

            </SettingsCard>

            <SettingsCard title="Monitoring" description="Audit logs and active sessions.">
                <SettingRow label="Active Sessions" description="View currently logged in users.">
                    <button type="button" style={buttonStyle}>View Sessions</button>
                </SettingRow>
                <SettingRow label="Audit Logs" description="Download security logs.">
                    <button type="button" style={buttonStyle}>Download Logs</button>
                </SettingRow>
            </SettingsCard>
        </div>
    );
};

const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    color: "#334155",
    outline: "none"
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

export default SecuritySettings;
