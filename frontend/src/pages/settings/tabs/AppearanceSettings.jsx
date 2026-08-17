
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";

const AppearanceSettings = ({ data, onChange }) => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Appearance
            </h2>
            <SettingsCard title="Theme & Display" description="Customize how StaffSpire looks on your device.">
                
                <SettingRow label="Theme" description="Select your preferred color theme.">
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem" }}>
                            <input 
                                type="radio" 
                                name="theme" 
                                value="light" 
                                checked={data.theme === "light"} 
                                onChange={(e) => onChange("theme", e.target.value)} 
                            /> Light
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem" }}>
                            <input 
                                type="radio" 
                                name="theme" 
                                value="dark" 
                                checked={data.theme === "dark"} 
                                onChange={(e) => onChange("theme", e.target.value)} 
                            /> Dark
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem" }}>
                            <input 
                                type="radio" 
                                name="theme" 
                                value="system" 
                                checked={data.theme === "system" || !data.theme} 
                                onChange={(e) => onChange("theme", e.target.value)} 
                            /> System
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem" }}>
                            <input 
                                type="radio" 
                                name="theme" 
                                value="amber" 
                                checked={data.theme === "amber"} 
                                onChange={(e) => onChange("theme", e.target.value)} 
                            /> Amber
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem" }}>
                            <input 
                                type="radio" 
                                name="theme" 
                                value="softspire" 
                                checked={data.theme === "softspire"} 
                                onChange={(e) => onChange("theme", e.target.value)} 
                            /> Softspire
                        </label>
                    </div>
                </SettingRow>

                <SettingRow label="Accent Color" description="Choose a primary color for buttons and highlights.">
                    <input 
                        type="color" 
                        value={data.accentColor || "#4f46e5"} 
                        onChange={(e) => onChange("accentColor", e.target.value)}
                        style={{ width: "40px", height: "40px", border: "none", cursor: "pointer", padding: 0, borderRadius: "50%" }}
                    />
                </SettingRow>

                <SettingRow label="Sidebar Style">
                    <select 
                        value={data.sidebarStyle || "expanded"} 
                        onChange={(e) => onChange("sidebarStyle", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="expanded">Expanded</option>
                        <option value="collapsed">Collapsed by default</option>
                        <option value="iconOnly">Icon Only</option>
                    </select>
                </SettingRow>

                <SettingRow label="Layout Density">
                    <select 
                        value={data.density || "comfortable"} 
                        onChange={(e) => onChange("density", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="comfortable">Comfortable</option>
                        <option value="compact">Compact Mode</option>
                    </select>
                </SettingRow>

                <SettingRow label="Font Size">
                    <select 
                        value={data.fontSize || "medium"} 
                        onChange={(e) => onChange("fontSize", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
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
    outline: "none",
    backgroundColor: "#f8fafc",
    cursor: "pointer"
};

export default AppearanceSettings;
