
import SettingsCard from "./SettingsCard";

const IntegrationsSettings = () => {
    const integrations = [
        { name: "Google Calendar", icon: "📅", color: "#4285F4" },
        { name: "Microsoft Teams", icon: "💬", color: "#6264A7" },
        { name: "Slack", icon: "🔔", color: "#E01E5A" },
        { name: "Zoom", icon: "🎥", color: "#2D8CFF" },
        { name: "Outlook", icon: "✉️", color: "#0078D4" },
        { name: "Gmail", icon: "📧", color: "#EA4335" },
        { name: "Webhooks", icon: "🔗", color: "#334155" },
        { name: "API Keys", icon: "🔑", color: "#f59e0b" },
    ];

    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Integrations
            </h2>
            <SettingsCard title="Third-Party Services" description="Connect StaffSpire with your favorite tools.">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                    {integrations.map(int => (
                        <div key={int.name} style={{
                            padding: "20px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "12px",
                            backgroundColor: "#f8fafc",
                            position: "relative"
                        }}>
                            <div style={{ fontSize: "2rem", color: int.color }}>{int.icon}</div>
                            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#334155", fontWeight: "600" }}>{int.name}</h4>
                            <span style={{ 
                                position: "absolute", 
                                top: "-8px", 
                                right: "-8px", 
                                backgroundColor: "#4f46e5", 
                                color: "white", 
                                fontSize: "0.8rem", 
                                fontWeight: "bold", 
                                padding: "4px 8px", 
                                borderRadius: "12px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }}>
                                Coming Soon
                            </span>
                        </div>
                    ))}
                </div>
            </SettingsCard>
        </div>
    );
};

export default IntegrationsSettings;
