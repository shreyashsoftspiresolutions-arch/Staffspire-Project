import { useReducer } from "react";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import InlineAlert from "../../components/InlineAlert";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import axios from "axios";
import contactMapImg from "../../assets/location.png";
import "../../styles/contact.css";

const contactReducer = (state, action) => {
    switch (action.type) {
        case "SET_FIELD": return { ...state, [action.field]: action.value };
        case "SET_ALERT": return { ...state, formAlert: action.msg, formAlertType: action.alertType };
        case "SET_SUBMITTING": return { ...state, submitting: action.value };
        case "RESET_FORM": return { ...state, name: "", email: "", subject: "Enterprise Solutions Inquiry", message: "" };
        default: return state;
    }
};

function Contact() {
    useScrollReveal();

    const [state, dispatch] = useReducer(contactReducer, {
        name: "", email: "", subject: "Enterprise Solutions Inquiry", message: "",
        formAlert: "", formAlertType: "success", submitting: false
    });
    const { name, email, subject, message, formAlert, formAlertType, submitting } = state;

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch({ type: "SET_SUBMITTING", value: true });
        dispatch({ type: "SET_ALERT", msg: "", alertType: "success" });

        try {
            const response = await axios.post("http://localhost:5000/api/auth/contact", {
                name,
                email,
                subject,
                message
            });

            if (response.data.success) {
                dispatch({ type: "SET_ALERT", msg: "Message sent successfully! We will get back to you shortly.", alertType: "success" });
                dispatch({ type: "RESET_FORM" });
            } else {
                dispatch({ type: "SET_ALERT", msg: response.data.message || "Failed to send message.", alertType: "error" });
            }
        } catch (error) {
            console.error("Error sending contact message:", error);
            dispatch({ type: "SET_ALERT", msg: error.response?.data?.message || "An error occurred while sending your message. Please try again.", alertType: "error" });
        } finally {
            dispatch({ type: "SET_SUBMITTING", value: false });
        }
    };

    return (
        <div className="ss-public-body">
            <Navbar />

            <main className="ct-main reveal-fade-in">
                {/* Background Atmospheric Effects */}
                <div className="ct-ambient-glow-1"></div>
                <div className="ct-ambient-glow-2"></div>

                {/* Header */}
                <div className="ct-header">
                    <h1 className="ct-title">Let's Talk</h1>
                    <p className="ct-subtitle">
                        Have questions about scaling your global workforce? Our enterprise consultants are
                        ready to help you architect the future of your HR operations.
                    </p>
                </div>

                {/* Content Grid */}
                <div className="ct-grid">
                    {/* Left Side: Contact Form */}
                    <div className="ct-form-panel">
                        {formAlert && (
                            <InlineAlert
                                type={formAlertType}
                                message={formAlert}
                                onClose={() => dispatch({ type: "SET_ALERT", msg: "", alertType: "success" })}
                            />
                        )}

                        <form onSubmit={handleSubmit} className="ct-form">
                            <div className="ct-form-row">
                                <div className="ct-form-group">
                                    <label htmlFor="name" className="ct-label">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="ct-input"
                                        placeholder="John Doe"
                                        required
                                        value={name}
                                        onChange={(e) => dispatch({ type: "SET_FIELD", field: "name", value: e.target.value })}
                                    />
                                </div>
                                <div className="ct-form-group">
                                    <label htmlFor="email" className="ct-label">Business Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="ct-input"
                                        placeholder="john@company.com"
                                        required
                                        value={email}
                                        onChange={(e) => dispatch({ type: "SET_FIELD", field: "email", value: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="ct-form-group">
                                <label htmlFor="subject" className="ct-label">Subject</label>
                                <select
                                    id="subject"
                                    className="ct-select"
                                    value={subject}
                                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "subject", value: e.target.value })}
                                >
                                    <option value="Enterprise Solutions Inquiry">Enterprise Solutions Inquiry</option>
                                    <option value="Technical Support">Technical Support</option>
                                    <option value="Partnership Opportunities">Partnership Opportunities</option>
                                    <option value="Billing & Accounts">Billing &amp; Accounts</option>
                                </select>
                            </div>

                            <div className="ct-form-group">
                                <label htmlFor="message" className="ct-label">Message</label>
                                <textarea
                                    id="message"
                                    className="ct-textarea"
                                    placeholder="How can our team support your growth?"
                                    rows="6"
                                    required
                                    value={message}
                                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "message", value: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="ct-form-actions">
                                <button type="submit" className="ct-submit-btn" disabled={submitting}>
                                    {submitting ? "Sending..." : "Send Message"}
                                    <span className="material-symbols-outlined ct-send-icon">send</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Side: Info & Support */}
                    <div className="ct-info-col">
                        {/* Office Card */}
                        <div className="ct-info-card ct-office-card">
                            <div className="ct-card-decor">
                                <span className="material-symbols-outlined ct-decor-icon">location_on</span>
                            </div>
                            <h3 className="ct-card-title">
                                <span className="material-symbols-outlined ct-card-title-icon">corporate_fare</span>
                                Global Headquarters
                            </h3>
                            <div className="ct-office-details">
                                <div className="ct-detail-row">
                                    <span className="material-symbols-outlined ct-detail-icon">map</span>
                                    <p className="ct-detail-text">
                                        Ahilyanagar, Maharashtra, India<br />
                                        
                                    </p>
                                </div>
                                <div className="ct-detail-row">
                                    <span className="material-symbols-outlined ct-detail-icon">mail</span>
                                    <a href="mailto:contact@staffspire.com" className="ct-detail-link">
                                        shreyash.softspiresolutions.com
                                    </a>
                                </div>
                                <div className="ct-social-links">
                                    <a href="#" className="ct-social-btn" aria-label="GitHub">
                                        <svg className="ct-social-svg" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                                        </svg>
                                    </a>
                                    <a href="#" className="ct-social-btn" aria-label="LinkedIn">
                                        <svg className="ct-social-svg" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Map Card */}
                        <div className="ct-map-card">
                            <img
                                className="ct-map-img"
                                alt="San Francisco Office Map illustration"
                                src={contactMapImg}
                            />
                            <div className="ct-map-overlay"></div>
                            <div className="ct-map-badge">
                                <span className="ct-badge-dot"></span>
                                <span className="ct-badge-text">Live Office Operations</span>
                            </div>
                        </div>

                        {/* Support Hours Card */}
                        <div className="ct-info-card">
                            <h3 className="ct-card-title">
                                <span className="material-symbols-outlined ct-card-title-icon">schedule</span>
                                Support Hours
                            </h3>
                            <div className="ct-hours-rows">
                                <div className="ct-hours-row">
                                    <span className="ct-hours-day">Mon — Fri</span>
                                    <span className="ct-hours-time">24 Hours (Enterprise)</span>
                                </div>
                                <div className="ct-hours-row">
                                    <span className="ct-hours-day">Sat — Sun</span>
                                    <span className="ct-hours-time">Limited Availability</span>
                                </div>
                            </div>
                        </div>

                        {/* Common Questions */}
                        <div className="ct-info-card">
                            <h3 className="ct-card-title">Common Questions</h3>
                            <div className="ct-faq-list">
                                <details className="ct-faq-item">
                                    <summary className="ct-faq-trigger">
                                        How fast is your response time?
                                        <span className="material-symbols-outlined ct-faq-arrow">expand_more</span>
                                    </summary>
                                    <p className="ct-faq-answer">
                                        Enterprise clients receive a dedicated success manager with a guaranteed
                                        2-hour response time during business hours.
                                    </p>
                                </details>
                                <details className="ct-faq-item">
                                    <summary className="ct-faq-trigger">
                                        Do you offer global implementation?
                                        <span className="material-symbols-outlined ct-faq-arrow">expand_more</span>
                                    </summary>
                                    <p className="ct-faq-answer">
                                        Yes, we provide on-site implementation support for our Scale and Enterprise
                                        tiers across 40+ countries.
                                    </p>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Contact;
