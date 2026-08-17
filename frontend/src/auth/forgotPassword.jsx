import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/Softspire_Logo.png";
import Navbar from "../components/public/Navbar";
import InlineAlert from "../components/InlineAlert";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [alertType, setAlertType] = useState("");
    const navigate = useNavigate();

    const showAlert = (msg, type) => {
        setAlertMsg(msg);
        setAlertType(type);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isLoading) return;
        setAlertMsg("");
        setIsLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/forgot-password",
                { email }
            );

            localStorage.setItem("resetEmail", email);
            localStorage.setItem("generatedOTP", response.data.otp);

            showAlert("OTP sent successfully! Check your email.", "success");
            setTimeout(() => navigate("/verify-otp"), 1500);
        } catch (error) {
            showAlert(
                error.response?.data?.message || "Failed to send OTP. Please try again.",
                "error"
            );
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
                                <h1>Forgot Password</h1>
                                <p>Enter your registered email to receive a one-time password.</p>
                            </div>

                            {/* Alert */}
                            <InlineAlert
                                type={alertType}
                                message={alertMsg}
                                onClose={() => setAlertMsg("")}
                            />

                            {/* Form */}
                            <form onSubmit={handleSubmit} autoComplete="off">
                                <div className="login-field">
                                    <label htmlFor="fp-email">Email Address</label>
                                    <div className="login-input-wrap">
                                        <span className="material-symbols-outlined login-input-icon">mail</span>
                                        <input
                                            id="fp-email"
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="login-input has-icon"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="login-submit-wrap">
                                    <button
                                        type="submit"
                                        className="login-submit-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending OTP..." : "Send OTP"}
                                    </button>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="login-footer">
                                <p>
                                    Remembered your password?{" "}
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

export default ForgotPassword;