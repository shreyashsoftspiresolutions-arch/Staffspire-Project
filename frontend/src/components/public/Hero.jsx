import { Link } from "react-router-dom";

function Hero() {
    return (
        <section className="ss-hero-section">
            {/* Hero Content */}
            <div className="ss-hero-content reveal-slide-left">
                <div className="ss-hero-badge">
                    <span className="ss-hero-badge-dot"></span>
                    <span>v4.0 Launching Now</span>
                </div>

                <h1 className="ss-hero-title">
                    Smart Workforce Management for{" "}
                    <span className="ss-hero-title-accent">Modern Organizations</span>
                </h1>

                <p className="ss-hero-subtitle">
                    Manage employees, departments, attendance, leave requests, tasks, reports
                    and analytics from one intelligent platform.
                </p>

                <div className="ss-hero-btns">
                    <Link to="/login" className="ss-btn-primary">
                        Get Started Free
                        <span className="material-symbols-outlined ss-btn-icon">arrow_forward</span>
                    </Link>
                    <Link to="/features" className="ss-btn-ghost">
                        <span className="material-symbols-outlined ss-btn-icon">play_circle</span>
                        Watch Demo
                    </Link>
                </div>
            </div>

            {/* Floating Dashboard Mockup */}
            <div className="ss-hero-media reveal-slide-right">
                <div className="ss-dashboard-card">
                    {/* Dashboard Header */}
                    <div className="ss-dash-header">
                        <div className="ss-dash-title-row">
                            <div className="ss-dash-icon-box">
                                <span className="material-symbols-outlined">dashboard</span>
                            </div>
                            <h3 className="ss-dash-title">Admin Dashboard</h3>
                        </div>
                        <div className="ss-dash-controls">
                            <div className="ss-dash-ctrl-dot"></div>
                            <div className="ss-dash-ctrl-dot ss-ctrl-blue"></div>
                        </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="ss-dash-mini-grid">
                        <div className="ss-dash-mini-card">
                            <span className="ss-dash-mini-label">Attendance Today</span>
                            <div className="ss-dash-mini-value-row">
                                <span className="ss-dash-mini-value">94%</span>
                                <span className="ss-dash-mini-trend">
                                    <span className="material-symbols-outlined">trending_up</span>+2.1%
                                </span>
                            </div>
                        </div>
                        <div className="ss-dash-mini-card">
                            <span className="ss-dash-mini-label">Tasks Completed</span>
                            <div className="ss-dash-progress-bar">
                                <div className="ss-dash-progress-fill"></div>
                            </div>
                            <span className="ss-dash-progress-label">75% Done</span>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="ss-dash-chart">
                        <div className="ss-dash-bar" style={{ height: "40%" }}></div>
                        <div className="ss-dash-bar" style={{ height: "60%", opacity: 0.7 }}></div>
                        <div className="ss-dash-bar" style={{ height: "85%", opacity: 0.85 }}></div>
                        <div className="ss-dash-bar" style={{ height: "100%" }}></div>
                        <div className="ss-dash-bar" style={{ height: "70%", opacity: 0.8 }}></div>
                        <div className="ss-dash-bar" style={{ height: "50%", opacity: 0.6 }}></div>
                    </div>

                    {/* Notification Float */}
                    <div className="ss-dash-notif">
                        <span className="material-symbols-outlined ss-notif-icon">notifications_active</span>
                        <div>
                            <p className="ss-notif-title">New Leave Request</p>
                            <p className="ss-notif-sub">Sarah Miller - 3 Days</p>
                        </div>
                    </div>
                </div>

                {/* Background blobs */}
                <div className="ss-hero-blob-right"></div>
                <div className="ss-hero-blob-left"></div>
            </div>
        </section>
    );
}

export default Hero;
