

const SettingSwitch = ({ checked, onChange }) => {
    return (
        <label style={{
            display: "inline-block",
            width: "44px",
            height: "24px",
            position: "relative",
            cursor: "pointer"
        }}>
            <input 
                type="checkbox" 
                aria-label="Toggle setting"
                checked={checked || false}
                onChange={(e) => onChange(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: checked ? "#4f46e5" : "#cbd5e1",
                borderRadius: "24px",
                transition: "0.3s"
            }}>
                <span style={{
                    position: "absolute",
                    content: '""',
                    height: "18px",
                    width: "18px",
                    left: checked ? "22px" : "3px",
                    bottom: "3px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.3s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }} />
            </span>
        </label>
    );
};

export default SettingSwitch;
