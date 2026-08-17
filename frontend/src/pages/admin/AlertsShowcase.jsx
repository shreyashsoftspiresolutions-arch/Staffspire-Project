import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

function AlertsShowcase() {
    const [secondsLeft, setSecondsLeft] = useState(45 * 60 + 12);
    const [showSuccessAlert, setShowSuccessAlert] = useState(true);

    // Live countdown timer micro-interaction
    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatCountdown = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <DashboardLayout>
            <div className="alerts-showcase-container">
                <header className="alerts-header">
                    <h1>Alert System Showcase</h1>
                    <p>
                        A demonstration of high-performance alert patterns for enterprise-grade human capital
                        management software. Focused on clarity, motion, and accessibility.
                    </p>
                </header>

                <div className="alerts-grid">
                    {/* 1. Success Alert */}
                    {showSuccessAlert && (
                        <section className="alert-card">
                            <div className="alert-header-row">
                                <div className="alert-info-block">
                                    <div className="alert-icon-wrapper success">
                                        <span className="material-symbols-outlined">check_circle</span>
                                    </div>
                                    <div className="alert-content-text">
                                        <h3>Task Completed</h3>
                                        <p>The quarterly payroll audit has been finalized.</p>
                                    </div>
                                </div>
                                <span className="alert-time-badge">Just Now</span>
                            </div>
                            <div className="alert-actions-row">
                                <button type="button" className="btn-alert-primary" onClick={() => alert("Opening payroll audit details...")}>
                                    View Details
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>open_in_new</span>
                                </button>
                                <button type="button" className="btn-alert-close" onClick={() => setShowSuccessAlert(false)} title="Dismiss">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                                </button>
                            </div>
                        </section>
                    )}

                    {/* 2. Warning Alert */}
                    <section className="alert-card warning-glow">
                        <span className="material-symbols-outlined warning-bg-icon">warning</span>
                        <div className="alert-info-block">
                            <div className="alert-icon-wrapper warning">
                                <span className="material-symbols-outlined">construction</span>
                            </div>
                            <div className="alert-content-text">
                                <h3>System Maintenance</h3>
                                <p>A planned security update will begin shortly.</p>
                            </div>
                        </div>
                        <div className="warning-downtime-box">
                            <div className="downtime-text">
                                <span className="downtime-label">Scheduled Downtime</span>
                                <span className="downtime-time">{formatCountdown(secondsLeft)}</span>
                            </div>
                            <button type="button" className="btn-warning-remind" onClick={() => alert("Reminder set for 15 minutes before downtime.")}>
                                Remind me
                            </button>
                        </div>
                        <div className="alert-actions-row">
                            <button type="button" className="btn-warning-ack" onClick={() => alert("Maintenance acknowledged.")}>
                                Acknowledge
                            </button>
                        </div>
                    </section>

                    {/* 3. Confirm Deletion Alert */}
                    <section className="deletion-wrapper-card">
                        <img 
                            className="deletion-bg-image" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4W22aE-CV7_45o81pPNj6t8C0BxCGs4tRtvTLo0gKp5fD7Fn0Px2pLieqf_TNmsQ02kleTYIet3qMaiszYt4wJrj5Fv36wtGtJyNjIO7_ETlPKTE3M2z7a_Zo40rOtcpyTPsqn0Fv5DSd5z2r8WujAqDo027rImWqT0yEUtWZ-uKd5WU6jVBqeaqJPQRDd_3kE44KLI4Hf8P7WmA-c-5-BB6VL03IUkBlkr5nYr6UG9OaCif5LadGNEZ7UJ8oTwv7wzaGFeLuVQ" 
                            alt="Dashboard mockup background" 
                        />
                        <div className="deletion-overlay">
                            <div className="deletion-glass-panel">
                                <div className="deletion-info-row">
                                    <div className="deletion-icon-box">
                                        <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>delete_forever</span>
                                    </div>
                                    <div className="deletion-text-box">
                                        <h3>Confirm Deletion</h3>
                                        <p>This action cannot be undone. All associated performance metrics for 'Sarah Jenkins' will be purged.</p>
                                    </div>
                                </div>
                                <div className="deletion-buttons">
                                    <button type="button" className="btn-delete-anyway" onClick={() => alert("Item deleted.")}>
                                        Delete Anyway
                                    </button>
                                    <button type="button" className="btn-delete-undo" onClick={() => alert("Deletion undone.")}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>undo</span>
                                        Undo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Info Policy Alert */}
                    <section className="alert-card info-policy">
                        <span className="material-symbols-outlined info-bg-icon">info</span>
                        <div>
                            <div className="info-header-row" style={{ marginBottom: "16px" }}>
                                <div className="info-icon-badge">
                                    <span className="material-symbols-outlined">policy</span>
                                </div>
                                <h3 className="info-title">New Policy Update</h3>
                            </div>
                            <p className="info-body-text">
                                The updated 'Remote Work & Equipment' policy for FY24 is now available for review and signature. Please complete by Friday.
                            </p>
                        </div>
                        <div className="info-bottom-row">
                            <div className="avatar-stack">
                                <div className="avatar-stack-item blue">JD</div>
                                <div className="avatar-stack-item gray">AS</div>
                                <div className="avatar-stack-item dark">+12</div>
                            </div>
                            <button type="button" className="btn-info-read" onClick={() => alert("Opening policy document...")}>
                                Read Now
                            </button>
                        </div>
                    </section>
                </div>

                {/* Token Map Style Guide */}
                <div className="token-map-section">
                    <h2>Component Token Map</h2>
                    <div className="token-grid">
                        <div className="token-item-card">
                            <p className="token-label-title">Success Palette</p>
                            <div className="token-color-bar success">#10B981</div>
                        </div>
                        <div className="token-item-card">
                            <p className="token-label-title">Warning Palette</p>
                            <div className="token-color-bar warning">#F59E0B</div>
                        </div>
                        <div className="token-item-card">
                            <p className="token-label-title">Error Palette</p>
                            <div className="token-color-bar danger">#BA1A1A</div>
                        </div>
                        <div className="token-item-card">
                            <p className="token-label-title">Info Palette</p>
                            <div className="token-color-bar info">#004AC6</div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default AlertsShowcase;
