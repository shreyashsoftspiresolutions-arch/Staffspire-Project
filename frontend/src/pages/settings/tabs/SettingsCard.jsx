

const SettingsCard = ({ title, children, description }) => {
    return (
        <div style={{
            width: "100%",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            border: "1px solid #e2e8f0",
            padding: "24px",
            marginBottom: "24px"
        }}>
            <h3 style={{ 
                margin: "0 0 8px 0", 
                fontSize: "1.125rem", 
                fontWeight: "600", 
                color: "#1e293b" 
            }}>
                {title}
            </h3>
            {description && (
                <p style={{ margin: "0 0 20px 0", fontSize: "0.875rem", color: "#64748b" }}>
                    {description}
                </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {children}
            </div>
        </div>
    );
};

export default SettingsCard;
