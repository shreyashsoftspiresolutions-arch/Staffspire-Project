import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/Softspire_Logo.png";
import Navbar from "../components/public/Navbar";
import InlineAlert from "../components/InlineAlert";

function VerifyOTP() {
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [alertType, setAlertType] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isLoading) return;
        setAlertMsg("");
        setIsLoading(true);

        try {
            const email = localStorage.getItem("resetEmail");

            await axios.post(
                "http://localhost:5000/api/auth/verify-otp",
                { email, otp }
            );

            setAlertMsg("OTP verified! Redirecting...");
            setAlertType("success");
            localStorage.setItem("otpVerified", "true");
            setTimeout(() => navigate("/reset-password"), 1200);
        } catch (error) {
            setAlertMsg(
                error.response?.data?.message || "OTP Verification Failed. Please try again."
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
                                <h1>Verify OTP</h1>
                                <p>Enter the 6-digit code sent to your email.</p>
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
                                    <label htmlFor="otp-input">One-Time Password</label>
                                    <div className="login-input-wrap">
                                        {/* <span className="material-symbols-outlined login-input-icon">pin</span> */}
                                        <input
                                            id="otp-input"
                                            type="text"
                                            placeholder="e.g. 284609"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="login-input has-icon"
                                            maxLength={6}
                                            required
                                            autoFocus
                                            style={{ letterSpacing: "0.25em", fontSize: "1.1rem" }}
                                        />
                                    </div>
                                </div>
                                <br />

                                <div className="login-submit-wrap">
                                    <button
                                        type="submit"
                                        className="login-submit-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Verifying..." : "Verify OTP"}
                                    </button>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="login-footer">
                                <p>
                                    Did not receive the code?{" "}
                                    <button
                                        type="button"
                                        className="login-register-link"
                                        onClick={() => navigate("/forgot-password")}
                                        style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 600, cursor: "pointer" }}
                                    >
                                        Resend OTP
                                    </button>
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default VerifyOTP;