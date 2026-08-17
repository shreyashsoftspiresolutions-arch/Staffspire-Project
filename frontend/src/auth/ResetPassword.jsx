import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import logo from "../assets/Softspire_Logo.png";
import Navbar from "../components/public/Navbar";
import InlineAlert from "../components/InlineAlert";

function ResetPassword() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [alertType, setAlertType] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isLoading) return;
        setAlertMsg("");

        if (newPassword !== confirmPassword) {
            setAlertMsg("Passwords do not match. Please try again.");
            setAlertType("error");
            return;
        }

        if (newPassword.length < 6) {
            setAlertMsg("Password must be at least 6 characters.");
            setAlertType("warning");
            return;
        }

        setIsLoading(true);

        try {
            const email = localStorage.getItem("resetEmail");
            await axios.put(
                "http://localhost:5000/api/auth/reset-password",
                { email, newPassword }
            );

            setAlertMsg("Password reset successfully! Redirecting to login...");
            setAlertType("success");
            localStorage.removeItem("resetEmail");
            localStorage.removeItem("otpVerified");
            setTimeout(() => navigate("/login"), 1800);
        } catch (error) {
            setAlertMsg(
                error.response?.data?.message || "Failed to reset password. Please try again."
            );
            setAlertType("error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar theme="dark" />
            <div className="login-page" style={{ flex: 1, padding: "40px 24px" }}>
                <main className="login-main">
                    <section className="login-card">
                        <div className="login-card-inner">
                            {/* Logo */}
                            <div className="login-logo-wrap">
                                <img
                                    src={logo}
                                    alt="SoftSpire Solutions"
                                    className="login-logo"
                                />
                            </div>

                            {/* Heading */}
                            <div className="login-heading">
                                <h1>Reset Password</h1>
                                <p>Choose a strong new password for your account.</p>
                            </div>

                            {/* Alert */}
                            <InlineAlert
                                type={alertType}
                                message={alertMsg}
                                onClose={() => setAlertMsg("")}
                            />

                            {/* Form */}
                            <form onSubmit={handleSubmit} autoComplete="off">
                                {/* New Password */}
                                <div className="login-field">
                                    <label htmlFor="new-password">New Password</label>
                                    <div className="login-password-wrap">
                                        <input
                                            id="new-password"
                                            type={showNew ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                        <br />
                                        <button
                                            type="button"
                                            className="login-eye-btn"
                                            onClick={() => setShowNew(p => !p)}
                                            tabIndex={-1}
                                            aria-label={showNew ? "Hide password" : "Show password"}
                                        >
                                            {showNew ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <br />

                                {/* Confirm Password */}
                                <div className="login-field">
                                    <label htmlFor="confirm-password">Confirm Password</label>
                                    <div className="login-password-wrap">
                                        <input
                                            id="confirm-password"
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Re-enter new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            style={{
                                                borderColor: confirmPassword && confirmPassword !== newPassword
                                                    ? "#ef4444" : undefined
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="login-eye-btn"
                                            onClick={() => setShowConfirm(p => !p)}
                                            tabIndex={-1}
                                            aria-label={showConfirm ? "Hide password" : "Show password"}
                                        >
                                            {showConfirm ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
                                        </button>
                                    </div>
                                    {confirmPassword && confirmPassword !== newPassword && (
                                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                                            ⚠ Passwords do not match
                                        </span>
                                    )}
                                </div>
                                <br />

                                <div className="login-submit-wrap">
                                    <button
                                        type="submit"
                                        className="login-submit-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Resetting..." : "Reset Password"}
                                    </button>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="login-footer">
                                <p>
                                    Want to go back?{" "}
                                    <Link to="/login" className="login-register-link" style={{ textDecoration: "none", fontWeight: 600 }}>
                                        Back to Login
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default ResetPassword;