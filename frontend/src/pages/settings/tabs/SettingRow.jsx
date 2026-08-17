

const SettingRow = ({ label, description, children }) => {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0",
            borderBottom: "1px solid #f1f5f9"
        }}>
            <div style={{ maxWidth: "60%", textAlign: "left" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "500", color: "#334155" }}>{label}</h4>
                {description && <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>{description}</p>}
            </div>
            <div style={{ minWidth: "150px", textAlign: "right" }}>
                {children}
            </div>
        </div>
    );
};

export default SettingRow;
