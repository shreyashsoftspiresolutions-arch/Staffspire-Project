import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import logo from "../assets/Softspire_Logo.png";
import Navbar from "../components/public/Navbar";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [alertMsg, setAlertMsg] = useState("");
    const [alertType, setAlertType] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Load remembered email on mount
    useEffect(() => {
        localStorage.removeItem("rememberedEmail");
        setEmail("");
        setRememberMe(false);
    }, []);

    const handlePaste = (e) => {
        const pastedText = e.clipboardData.getData("text");
        if (!pastedText) return;

        // Auto-detect and parse combined credentials format e.g. "Employee ID: EM1000SS Temporary Password: pwd"
        const idMatch = pastedText.match(/Employee\s+ID:\s*([A-Za-z0-9-]+)/i);
        const pwdMatch = pastedText.match(/(?:Temporary\s+)?Password:\s*(\S+)/i);

        if (idMatch && pwdMatch) {
            e.preventDefault(); // Prevent pasting the long combined text into a single field
            const extractedId = idMatch[1].trim();
            const extractedPassword = pwdMatch[1].trim();

            setEmail(extractedId);
            setPassword(extractedPassword);

            setAlertMsg("Credentials auto-filled successfully!");
            setAlertType("success");
            setTimeout(() => {
                setAlertMsg("");
                setAlertType("");
            }, 3000);
        }
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (isLoading) return;
        setAlertMsg("");
        setAlertType("");

        let cleanEmail = email.trim();
        if (/^EM\d{4}SS$/i.test(cleanEmail)) {
            cleanEmail = cleanEmail.toUpperCase();
        } else {
            cleanEmail = cleanEmail.toLowerCase();
        }

        if (!cleanEmail || !password) {
            setAlertMsg("Email and Password are required");
            setAlertType("error");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    email: cleanEmail,
                    password
                }
            );

            // eslint-disable-next-line react-doctor/auth-token-in-web-storage
            localStorage.setItem("token", response.data.token);
            // eslint-disable-next-line react-doctor/auth-token-in-web-storage
            localStorage.setItem("user:v1", JSON.stringify(response.data.user));

            // Handle remember me
            if (rememberMe) {
                localStorage.setItem("rememberedEmail", cleanEmail);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            setRememberMe(false);

            if (response.data.user.must_change_password) {
                localStorage.setItem("forcePasswordChange", "true");
                setAlertMsg("First login detected: you must change your temporary password.");
                setAlertType("warning");
                setTimeout(() => navigate("/change-password"), 1500);
                return;
            } else {
                localStorage.removeItem("forcePasswordChange");
            }

            setAlertMsg(`Welcome ${response.data.user.name} (${response.data.user.role})`);
            setAlertType("success");

            const role = response.data.user.role;
            setTimeout(() => {
                if (role === "Admin") {
                    navigate("/admin/dashboard");
                } else if (role === "Manager") {
                    navigate("/manager/dashboard");
                } else if (role === "Employee") {
                    navigate("/employee/dashboard");
                }
            }, 1200);
        } catch (error) {
            setAlertMsg(error.response?.data?.message || "Login Failed");
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
                                <h1>Welcome back</h1>
                                <p>Log in to your Staffspire enterprise portal to manage human capital.</p>
                            </div>

                            {/* Alert */}
                            {alertMsg && (
                                <div className={`login-alert login-alert-${alertType}`}>
                                    {alertMsg}
                                </div>
                            )}

                            {/* Form */}
                            <form className="login-form" onSubmit={handleLogin} autoComplete="off">
                                <div className="login-field">
                                    <label htmlFor="email">Email or Employee ID</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="text"
                                        placeholder="Enter Email or Employee ID"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onPaste={handlePaste}
                                        autoComplete="off"
                                        required
                                    />
                                </div>

                                <div className="login-field">
                                    <label htmlFor="password">Password</label>
                                    <div className="login-password-wrap">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="login-eye-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label="Toggle password visibility"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="login-options">
                                    <div className="login-remember">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />
                                        <label htmlFor="remember-me">Remember me</label>
                                    </div>
                                    <button
                                        type="button"
                                        className="login-forgot-link"
                                        onClick={() => navigate("/forgot-password")}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>

                                <div className="login-submit-wrap">
                                    <button
                                        type="submit"
                                        className="login-submit-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Logging in..." : "Login"}
                                    </button>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="login-footer">
                                <p>
                                    Need to setup a new deployment?{" "}
                                    <button
                                        type="button"
                                        className="login-register-link"
                                        onClick={() => navigate("/register-admin")}
                                    >
                                        Register Admin
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

export default Login;
