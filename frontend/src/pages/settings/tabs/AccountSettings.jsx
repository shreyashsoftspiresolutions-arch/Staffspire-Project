
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";
import { Link } from "react-router-dom";

const AccountSettings = ({ data, onChange, user }) => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Account Settings
            </h2>
            <SettingsCard title="Profile Information" description="Update your account's profile information.">
                
                <SettingRow label="Profile Photo">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontWeight: "bold" }}>
                            {user?.name ? user.name.charAt(0) : "U"}
                        </div>
                        <button type="button" style={buttonStyle}>Change</button>
                    </div>
                </SettingRow>

                <SettingRow label="Username">
                    <input 
                        type="text"
                        aria-label="Username"
                        value={data.username || user?.name || ""} 
                        onChange={(e) => onChange("username", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Email Address">
                    <input 
                        type="email"
                        aria-label="Email Address"
                        value={data.email || user?.email || ""} 
                        onChange={(e) => onChange("email", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Phone Number">
                    <input 
                        type="text"
                        aria-label="Phone Number"
                        value={data.phone || ""} 
                        onChange={(e) => onChange("phone", e.target.value)}
                        style={inputStyle}
                        placeholder="+1 234 567 890"
                    />
                </SettingRow>

            </SettingsCard>

            <SettingsCard title="Security & Authentication">
                
                <SettingRow label="Password" description="Change your password securely.">
                    <Link to="/change-password" style={{ ...buttonStyle, textDecoration: "none", display: "inline-block" }}>
                        Change Password
                    </Link>
                </SettingRow>

                <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security.">
                    <button type="button" style={buttonStyle}>Enable 2FA</button>
                </SettingRow>

                <SettingRow label="Last Login">
                    <span style={{ fontSize: "0.9rem", color: "#64748b" }}>Today, 10:45 AM</span>
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

export default AccountSettings;
