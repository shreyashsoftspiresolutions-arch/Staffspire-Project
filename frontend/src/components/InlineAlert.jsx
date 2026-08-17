/**
 * InlineAlert — reusable in-page notification banner.
 * Props:
 *   type: "success" | "error" | "warning" | "info"
 *   message: string
 *   onClose: () => void  (optional)
 */
function InlineAlert({ type = "info", message, onClose }) {
    if (!message) return null;

    const config = {
        success: {
            bg: "rgba(16,185,129,0.12)",
            border: "#10b981",
            color: "#10b981",
            icon: "check_circle",
        },
        error: {
            bg: "rgba(239,68,68,0.12)",
            border: "#ef4444",
            color: "#ef4444",
            icon: "error",
        },
        warning: {
            bg: "rgba(245,158,11,0.12)",
            border: "#f59e0b",
            color: "#f59e0b",
            icon: "warning",
        },
        info: {
            bg: "rgba(59,130,246,0.12)",
            border: "#3b82f6",
            color: "#3b82f6",
            icon: "info",
        },
    };

    const c = config[type] || config.info;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: c.bg,
                border: `1px solid ${c.border}`,
                marginBottom: "18px",
                animation: "fadeSlideIn 0.25s ease",
            }}
        >
            <span
                className="material-symbols-outlined"
                style={{ color: c.color, fontSize: "20px", flexShrink: 0 }}
            >
                {c.icon}
            </span>
            <span style={{ flex: 1, fontSize: "0.875rem", color: c.color, fontWeight: 500 }}>
                {message}
            </span>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: c.color,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        opacity: 0.7,
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        close
                    </span>
                </button>
            )}
        </div>
    );
}

export default InlineAlert;
