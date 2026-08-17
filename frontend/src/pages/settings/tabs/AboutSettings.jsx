
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";

const AboutSettings = () => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                About StaffSpire
            </h2>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    backgroundColor: "#4f46e5", 
                    borderRadius: "20px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    color: "white", 
                    fontSize: "2rem", 
                    margin: "0 auto 16px auto",
                    fontWeight: "bold",
                    boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.4)"
                }}>
                    SS
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.5rem", color: "#1e293b" }}>StaffSpire HRIS</h3>
                <p style={{ margin: 0, color: "#64748b" }}>Modern Human Resource Management System</p>
            </div>

            <SettingsCard>
                <SettingRow label="Version">
                    <span style={{ fontSize: "0.95rem", color: "#334155" }}>1.5.0</span>
                </SettingRow>

                <SettingRow label="Developer">
                    <span style={{ fontSize: "0.95rem", color: "#334155" }}>Shreyash</span>
                </SettingRow>

                <SettingRow label="Technology Stack">
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {["React", "Express", "MySQL", "JWT"].map(tech => (
                            <span key={tech} style={{ padding: "4px 10px", backgroundColor: "#f1f5f9", borderRadius: "16px", fontSize: "0.8rem", color: "#475569", fontWeight: "500" }}>
                                {tech}
                            </span>
                        ))}
                    </div>
                </SettingRow>

                <SettingRow label="License">
                    <span style={{ fontSize: "0.95rem", color: "#334155" }}>MIT</span>
                </SettingRow>

                <SettingRow label="GitHub">
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", textDecoration: "none", fontSize: "0.95rem", fontWeight: "500" }}>
                        View Repository
                    </a>
                </SettingRow>
            </SettingsCard>
        </div>
    );
};

export default AboutSettings;
