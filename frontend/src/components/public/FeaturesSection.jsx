const features = [
    {
        icon: "badge",
        title: "Employee Management",
        desc: "Centralized profiles for your entire workforce with custom fields and secure document storage.",
        delay: "0ms",
    },
    {
        icon: "fingerprint",
        title: "Attendance Tracking",
        desc: "Real-time attendance monitoring with geofencing, IP locking, and biometric integration.",
        delay: "100ms",
    },
    {
        icon: "event_busy",
        title: "Leave Management",
        desc: "Automated leave workflows, accrual calculations, and team-wide absence calendars.",
        delay: "200ms",
    },
    {
        icon: "checklist",
        title: "Task Management",
        desc: "Integrated task allocation, deadline tracking, and performance-based scoring.",
        delay: "300ms",
    },
    {
        icon: "query_stats",
        title: "Analytics",
        desc: "Predictive insights into turnover rates, productivity spikes, and recruitment needs.",
        delay: "400ms",
    },
    {
        icon: "verified_user",
        title: "Enterprise Security",
        desc: "SOC2 Type II compliant data encryption with role-based access control (RBAC).",
        delay: "500ms",
    },
];

function FeaturesSection() {
    return (
        <section className="ss-features-section">
            <div className="ss-features-header reveal-fade-in">
                <h2 className="ss-features-title">Elevate Your Human Capital</h2>
                <p className="ss-features-subtitle">
                    Everything you need to scale from a small team to a global enterprise with zero friction.
                </p>
            </div>

            <div className="ss-features-grid">
                {features.map((f, i) => (
                    <div
                        key={`key-${i}` /* fixed by script */}
                        className="ss-feature-card reveal-fade-in"
                        style={{ transitionDelay: f.delay }}
                    >
                        <div className="ss-feature-icon-box">
                            <span className="material-symbols-outlined ss-feature-icon">{f.icon}</span>
                        </div>
                        <h4 className="ss-feature-card-title">{f.title}</h4>
                        <p className="ss-feature-card-desc">{f.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default FeaturesSection;
