import { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaEye, FaEyeSlash, FaLock, FaCheck } from "react-icons/fa";
import InlineAlert from "../../components/InlineAlert";

const formReducer = (state, action) => {
    switch (action.type) {
        case "SET_FIELD": return { ...state, [action.field]: action.value };
        case "SET_ALERT": return { ...state, alertMsg: action.msg, alertType: action.alertType };
        case "SET_SUBMITTING": return { ...state, isSubmitting: action.value };
        case "RESET_FORM": return { ...state, currentPassword: "", newPassword: "", confirmPassword: "" };
        default: return state;
    }
};

function ChangePassword() {
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(formReducer, {
        currentPassword: "", newPassword: "", confirmPassword: "",
        showCurrent: false, showNew: false, showConfirm: false,
        alertMsg: "", alertType: "", isSubmitting: false
    });
    const { currentPassword, newPassword, confirmPassword, showCurrent, showNew, showConfirm, alertMsg, alertType, isSubmitting } = state;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (newPassword !== confirmPassword) {
            dispatch({ type: "SET_ALERT", msg: "Passwords do not match. Please try again.", alertType: "error" });
            return;
        }

        dispatch({ type: "SET_SUBMITTING", value: true });
        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(
                "http://localhost:5000/api/auth/change-password",
                {
                    currentPassword,
                    newPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            dispatch({ type: "SET_ALERT", msg: response.data.message || "Password changed successfully!", alertType: "success" });

            // Clear forced password change flag
            localStorage.removeItem("forcePasswordChange");

            // Update user in localStorage
            const user = JSON.parse(localStorage.getItem("user:v1")) || {};
            user.must_change_password = 0;
            localStorage.setItem("user:v1", JSON.stringify(user));

            dispatch({ type: "RESET_FORM" });

            setTimeout(() => {
                if (user.role === "Admin") navigate("/admin/dashboard");
                else if (user.role === "Manager") navigate("/manager/dashboard");
                else navigate("/employee/dashboard");
            }, 1500);
        } catch (error) {
            console.log(error);
            dispatch({ type: "SET_ALERT", msg: error.response?.data?.message || "Failed To Change Password", alertType: "error" });
        } finally {
            dispatch({ type: "SET_SUBMITTING", value: false });
        }
    };

    return (
        <DashboardLayout>
            <div className="form-container-centered" style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <div className="form-card" style={{ 
                    width: "100%", 
                    maxWidth: "500px", 
                    padding: "36px", 
                    background: "white", 
                    borderRadius: "16px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
                    border: "1px solid #e2e8f0"
                }}>
                    <h2 style={{ 
                        marginBottom: "30px", 
                        fontWeight: "700", 
                        color: "#0f172a", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px",
                        fontSize: "1.5rem" 
                    }}>
                        <FaLock style={{ color: "#4f46e5" }} /> Change Password
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                        <InlineAlert
                            type={alertType}
                            message={alertMsg}
                            onClose={() => dispatch({ type: "SET_ALERT", msg: "", alertType: "" })}
                        />

                        {/* Current Password */}

                        <div className="form-group-custom">
                            <label className="form-label-custom" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Current Password</label>
                            <div style={{ position: "relative", marginTop: "6px" }}>
                                <input
                                    aria-label="Current Password"
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "currentPassword", value: e.target.value })}
                                    style={{ 
                                        width: "100%", 
                                        padding: "12px 40px 12px 12px", 
                                        border: "1px solid #cbd5e1", 
                                        borderRadius: "8px",
                                        fontSize: "15px"
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    aria-label="Toggle password visibility"
                                    style={{ 
                                        position: "absolute", 
                                        right: "12px", 
                                        top: "50%", 
                                        transform: "translateY(-50%)", 
                                        cursor: "pointer", 
                                        color: "#64748b",
                                        display: "flex",
                                        alignItems: "center",
                                        background: "none",
                                        border: "none",
                                        padding: 0
                                    }}
                                    onClick={() => dispatch({ type: "SET_FIELD", field: "showCurrent", value: !showCurrent })}
                                >
                                    {showCurrent ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="form-group-custom">
                            <label className="form-label-custom" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>New Password</label>
                            <div style={{ position: "relative", marginTop: "6px" }}>
                                <input
                                    aria-label="New Password"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "newPassword", value: e.target.value })}
                                    style={{ 
                                        width: "100%", 
                                        padding: "12px 40px 12px 12px", 
                                        border: "1px solid #cbd5e1", 
                                        borderRadius: "8px",
                                        fontSize: "15px"
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    aria-label="Toggle password visibility"
                                    style={{ 
                                        position: "absolute", 
                                        right: "12px", 
                                        top: "50%", 
                                        transform: "translateY(-50%)", 
                                        cursor: "pointer", 
                                        color: "#64748b",
                                        display: "flex",
                                        alignItems: "center",
                                        background: "none",
                                        border: "none",
                                        padding: 0
                                    }}
                                    onClick={() => dispatch({ type: "SET_FIELD", field: "showNew", value: !showNew })}
                                >
                                    {showCurrent ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group-custom">
                            <label className="form-label-custom" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Confirm Password</label>
                            <div style={{ position: "relative", marginTop: "6px" }}>
                                <input
                                    aria-label="Confirm Password"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "confirmPassword", value: e.target.value })}
                                    style={{ 
                                        width: "100%", 
                                        padding: "12px 40px 12px 12px", 
                                        border: "1px solid #cbd5e1", 
                                        borderRadius: "8px",
                                        fontSize: "15px"
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    aria-label="Toggle password visibility"
                                    style={{ 
                                        position: "absolute", 
                                        right: "12px", 
                                        top: "50%", 
                                        transform: "translateY(-50%)", 
                                        cursor: "pointer", 
                                        color: "#64748b",
                                        display: "flex",
                                        alignItems: "center",
                                        background: "none",
                                        border: "none",
                                        padding: 0
                                    }}
                                    onClick={() => dispatch({ type: "SET_FIELD", field: "showConfirm", value: !showConfirm })}
                                >
                                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="save-btn"
                            type="submit"
                            disabled={isSubmitting}
                            style={{ 
                                width: "100%", 
                                marginTop: "12px", 
                                display: "inline-flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                gap: "8px",
                                padding: "14px",
                                opacity: isSubmitting ? 0.6 : 1
                            }}
                        >
                            <FaCheck /> {isSubmitting ? "Updating..." : "Update Password"}
                        </button>

                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default ChangePassword;