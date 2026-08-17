import { useState, useEffect } from "react";
import axios from "axios";
import useSWR from "swr";
import { useNavigate, Link } from "react-router-dom";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import logo from "../assets/Softspire_Logo.png";
import Navbar from "../components/public/Navbar";
import InlineAlert from "../components/InlineAlert";

const fetcher = (url) => axios.get(url).then(res => res.data);

function RegisterAdmin() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Authorization states (if an admin already exists)
    const [adminExists, setAdminExists] = useState(false);
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [showAuthPassword, setShowAuthPassword] = useState(false);

    const [alertMsg, setAlertMsg] = useState("");
    const [alertType, setAlertType] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();


    const { data: adminData, error: adminError } = useSWR("http://localhost:5000/api/auth/check-admin-exists", fetcher);

    useEffect(() => {
        if (adminData && adminData.exists) {
            setAdminExists(true);
            setAlertMsg("An administrator already exists. Credentials of an existing admin are required to register another admin.");
            setAlertType("error");
        }
        if (adminError) {
            console.error("Failed to check if admin exists:", adminError);
        }
    }, [adminData, adminError]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isLoading) return;
        setAlertMsg("");
        setAlertType("");

        const cleanEmail = email.trim().toLowerCase();

        if (!name.trim() || !cleanEmail || !password) {
            setAlertMsg("All fields are required");
            setAlertType("error");
            return;
        }

        if (adminExists && (!authEmail.trim() || !authPassword)) {
            setAlertMsg("Existing admin authorization credentials are required");
            setAlertType("error");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                name: name.trim(),
                email: cleanEmail,
                password,
                authEmail: adminExists ? authEmail.trim().toLowerCase() : undefined,
                authPassword: adminExists ? authPassword : undefined
            };

            const res = await axios.post(
                "http://localhost:5000/api/auth/register-admin",
                payload
            );

            setAlertMsg(res.data.message);
            setAlertType("success");

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (err) {
            const errMsg = err.response?.data?.message || "Registration Failed";
            setAlertMsg(errMsg);
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
                    <section className="login-card" style={{ maxWidth: "520px" }}>
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
                                <h1>Register Administrator</h1>
                                <p>Set up your Staffspire administrative account credentials.</p>
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
                                    <label htmlFor="name">Full Name</label>
                                    <div className="login-input-wrap">
                                        {/* <span className="material-symbols-outlined login-input-icon">person</span> */}
                                        <input
                                            type="text"
                                            id="name"
                                            placeholder="Enter your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="login-input has-icon"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <br />

                                <div className="login-field">
                                    <label htmlFor="email">Email Address</label>
                                    <div className="login-input-wrap">
                                        {/* <span className="material-symbols-outlined login-input-icon">mail</span> */}
                                        <input
                                            type="email"
                                            id="email"
                                            placeholder="Enter email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="login-input has-icon"
                                            required
                                        />
                                    </div>
                                </div>
                                <br />

                                <div className="login-field">
                                    <label htmlFor="password">Password</label>
                                    <div className="login-password-wrap">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            placeholder="Create password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="login-eye-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Existing admin auth fields */}
                                {adminExists && (
                                    <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1.5px dashed #cbd5e1" }}>
                                        <div style={{ marginBottom: "16px", textAlign: "center" }}>
                                            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                Authorizing Admin Verification
                                            </span>
                                        </div>

                                        <div className="login-field">
                                            <label htmlFor="authEmail">Existing Admin Email</label>
                                            <div className="login-input-wrap">
                                                {/* <span className="material-symbols-outlined login-input-icon">admin_panel_settings</span> */}
                                                <input
                                                    type="email"
                                                    id="authEmail"
                                                    placeholder="Enter authorized admin email"
                                                    value={authEmail}
                                                    onChange={(e) => setAuthEmail(e.target.value)}
                                                    className="login-input has-icon"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <br />

                                        <div className="login-field">
                                            <label htmlFor="authPassword">Existing Admin Password</label>
                                            <div className="login-password-wrap">
                                                <input
                                                    type={showAuthPassword ? "text" : "password"}
                                                    id="authPassword"
                                                    placeholder="Enter authorized admin password"
                                                    value={authPassword}
                                                    onChange={(e) => setAuthPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="login-eye-btn"
                                                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                                                    tabIndex={-1}
                                                    aria-label={showAuthPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showAuthPassword ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="login-submit-wrap">
                                    <button
                                        type="submit"
                                        className="login-submit-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Registering..." : "Register Admin"}
                                    </button>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="login-footer">
                                <p>
                                    Already have an admin account?{" "}
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

export default RegisterAdmin;
