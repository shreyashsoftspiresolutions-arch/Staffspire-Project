import { Link } from "react-router-dom";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import imgSmallBiz from "../../assets/employees_working.png";
import imgMediumEnt from "../../assets/dashboard.png";
import imgEducation from "../../assets/staffspire_on_monitor.png";
import imgCorporate from "../../assets/global_work.png";
import "../../styles/solutions.css";

function Solutions() {
    useScrollReveal();

    return (
        <div className="ss-public-body">
            <Navbar />

            {/* ── Hero ────────────────────────────────────────── */}
            <section className="sl-hero">
                <div className="sl-hero-inner">
                    <span className="sl-hero-badge">Enterprise Excellence</span>
                    <h1 className="sl-hero-title">
                        Built for Every <span className="sl-hero-accent">Organization</span>
                    </h1>
                    <p className="sl-hero-subtitle">
                        Tailored HRIS solutions designed to scale with your ambition, from local startups to
                        global enterprises. StaffSpire bridges the gap between potential and performance.
                    </p>
                    <div className="sl-hero-btns">
                        <button type="button" className="sl-btn-primary">Start Your Transformation</button>
                        <button type="button" className="sl-btn-secondary">
                            <span className="material-symbols-outlined">play_circle</span>
                            Watch Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Industry Bento Grid ──────────────────────────── */}
            <section className="sl-section sl-section-light">
                <div className="sl-container">
                    <div className="sl-bento">

                        {/* 1. Small Businesses — 7/12 */}
                        <div className="sl-glass-card sl-card-7 reveal-fade-in">
                            <div className="sl-card-top">
                                <div>
                                    <h3 className="sl-card-title">Small Businesses</h3>
                                    <p className="sl-card-sub">From startup chaos to structured operational excellence.</p>
                                </div>
                                <span className="sl-icon-box">
                                    <span className="material-symbols-outlined sl-icon-lg">rocket_launch</span>
                                </span>
                            </div>

                            <div className="sl-two-col">
                                {/* Left: problem + solution */}
                                <div className="sl-text-col">
                                    <div className="sl-problem-block">
                                        <h4 className="sl-label-error">The Problem</h4>
                                        <p className="sl-body">
                                            Fragmented Data trapped in emails, paper files, and scattered
                                            spreadsheets leads to slow growth and costly hiring errors.
                                        </p>
                                    </div>
                                    <div className="sl-solution-block">
                                        <h4 className="sl-label-primary">StaffSpire Solution</h4>
                                        <ul className="sl-checklist">
                                            <li>
                                                <span className="material-symbols-outlined sl-check-icon">check_circle</span>
                                                Centralized Employee Hub
                                            </li>
                                            <li>
                                                <span className="material-symbols-outlined sl-check-icon">check_circle</span>
                                                Instant Accuracy for Payroll
                                            </li>
                                            <li>
                                                <span className="material-symbols-outlined sl-check-icon">check_circle</span>
                                                Rapid Onboarding Workflows
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Right: real image */}
                                <div className="sl-img-box">
                                    <img src={imgSmallBiz} alt="Small Business Office space" className="sl-bento-img" />
                                </div>
                            </div>

                            <div className="sl-card-footer">
                                <div className="sl-tags">
                                    <span className="sl-tag">Speed</span>
                                    <span className="sl-tag">Accuracy</span>
                                    <span className="sl-tag">Growth</span>
                                </div>
                                <button type="button" className="sl-learn-more">
                                    Learn More
                                    <span className="material-symbols-outlined sl-arrow">arrow_forward</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Medium Enterprises — 5/12 */}
                        <div className="sl-glass-card sl-card-5 reveal-fade-in" style={{ transitionDelay: "100ms" }}>
                            <div className="sl-me-icon-wrap">
                                <span className="material-symbols-outlined sl-icon-lg sl-icon-secondary">domain_add</span>
                            </div>
                            <h3 className="sl-card-title">Medium Enterprises</h3>
                            <p className="sl-card-sub" style={{ marginBottom: "24px" }}>Breaking through the complexity barrier of rapid scaling.</p>

                            <div className="sl-problem-block">
                                <h4 className="sl-label-error">The Problem</h4>
                                <p className="sl-body">
                                    Scalability Walls: Legacy systems break as headcount increases, causing cultural
                                    friction and manual bottlenecks.
                                </p>
                            </div>

                            {/* Visual: real image */}
                            <div className="sl-me-img-wrap">
                                <img src={imgMediumEnt} alt="Medium Enterprise scaling metrics" className="sl-bento-imga" />
                            </div>

                            <div className="sl-benefits-list">
                                <h4 className="sl-label-primary">Benefits</h4>
                                <div className="sl-benefit-item">
                                    <span className="material-symbols-outlined sl-benefit-icon">auto_mode</span>
                                    <span>Enterprise Automation</span>
                                </div>
                                <div className="sl-benefit-item">
                                    <span className="material-symbols-outlined sl-benefit-icon">hub</span>
                                    <span>Unified Culture Tools</span>
                                </div>
                            </div>

                            <button type="button" className="sl-btn-outline sl-mt-auto">Explore Enterprise</button>
                        </div>

                        {/* 3. Educational Institutions — full width */}
                        <div className="sl-glass-card sl-card-12 reveal-fade-in">
                            <div className="sl-edu-grid">
                                <div className="sl-edu-text">
                                    <div className="sl-edu-heading">
                                        <span className="sl-icon-box sl-icon-box-tertiary">
                                            <span className="material-symbols-outlined sl-icon-lg">school</span>
                                        </span>
                                        <h3 className="sl-card-title">Educational Institutions</h3>
                                    </div>
                                    <h4 className="sl-label-error" style={{ marginBottom: "12px" }}>Faculty Overload</h4>
                                    <p className="sl-body" style={{ marginBottom: "28px", lineHeight: "1.7" }}>
                                        Modernize academic administration with automated faculty tracking and
                                        resource management that lets educators focus on teaching.
                                    </p>
                                    <div className="sl-stats-row">
                                        <div className="sl-stat">
                                            <span className="sl-stat-num">99.9%</span>
                                            <span className="sl-stat-label">Compliance Accuracy</span>
                                        </div>
                                        <div className="sl-stat">
                                            <span className="sl-stat-num">40%</span>
                                            <span className="sl-stat-label">Reduced Admin Time</span>
                                        </div>
                                    </div>
                                    <button type="button" className="sl-btn-primary sl-btn-sm">View Education Package</button>
                                </div>

                                {/* Photo panel */}
                                <div className="sl-edu-photo">
                                    <img src={imgEducation} alt="Educational Institutions office" className="sl-edu-img" />
                                </div>
                            </div>
                        </div>

                        {/* 4. Corporate Organizations — 6/12 */}
                        <div className="sl-glass-card sl-card-6 reveal-fade-in">
                            <div className="sl-corp-visual">
                                <img src={imgCorporate} alt="Corporate Organizations global twin" className="sl-bento-imgb" />
                            </div>

                            <h3 className="sl-card-title" style={{ marginBottom: "12px" }}>Corporate Organizations</h3>
                            <p className="sl-body" style={{ marginBottom: "20px" }}>
                                <strong className="sl-error-text">The Problem:</strong> Global Fragmentation with localized
                                siloes making high-level strategic decisions impossible.
                            </p>

                            <div className="sl-quote-box">
                                <p className="sl-quote">
                                    "StaffSpire became our <strong>One Source of Truth</strong> across
                                    14 countries in less than 6 months."
                                </p>
                            </div>

                            <ul className="sl-feature-list">
                                <li className="sl-feature-item">
                                    <span className="material-symbols-outlined sl-feat-icon">insights</span>
                                    <div>
                                        <p className="sl-feat-title">High-level Insights</p>
                                        <p className="sl-feat-desc">Predictive AI for workforce planning.</p>
                                    </div>
                                </li>
                                <li className="sl-feature-item">
                                    <span className="material-symbols-outlined sl-feat-icon">admin_panel_settings</span>
                                    <div>
                                        <p className="sl-feat-title">Advanced Security</p>
                                        <p className="sl-feat-desc">Zero-trust HR data architecture.</p>
                                    </div>
                                </li>
                            </ul>

                            <button type="button" className="sl-btn-dark sl-mt-auto">Connect with Sales</button>
                        </div>

                        {/* 5. Healthcare — 6/12 */}
                        <div className="sl-glass-card sl-card-6 reveal-fade-in" style={{ transitionDelay: "150ms" }}>
                            <div className="sl-health-header">
                                <div className="sl-health-icon-wrap">
                                    <span className="material-symbols-outlined sl-health-icon">medical_services</span>
                                </div>
                                <div>
                                    <h3 className="sl-card-title">Healthcare</h3>
                                    <p className="sl-card-sub">Automated governance for high-stakes environments.</p>
                                </div>
                            </div>

                            <div className="sl-health-cards">
                                <div className="sl-risk-card">
                                    <h4 className="sl-risk-title">Compliance Risks</h4>
                                    <p className="sl-body">
                                        Manual tracking of certifications and shifts in healthcare leads to
                                        catastrophic legal and operational failures.
                                    </p>
                                </div>
                                <div className="sl-solution-card">
                                    <h4 className="sl-solution-title">StaffSpire Automated Governance</h4>
                                    <p className="sl-body">
                                        Real-time audit readiness and dynamic shift management designed for
                                        complex medical staffing.
                                    </p>
                                </div>
                            </div>

                            <ul className="sl-health-features">
                                <li className="sl-health-feat-item">
                                    <span className="material-symbols-outlined sl-benefit-icon">event_available</span>
                                    <span>Dynamic 24/7 Shift Scheduling</span>
                                </li>
                                <li className="sl-health-feat-item">
                                    <span className="material-symbols-outlined sl-benefit-icon">verified_user</span>
                                    <span>Automatic Credential Verification</span>
                                </li>
                            </ul>

                            <button type="button" className="sl-btn-outline sl-mt-auto">Download Healthcare Whitepaper</button>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── HR Evolution Comparison ──────────────────────── */}
            <section className="sl-comparison">
                <div className="sl-container">
                    <div className="sl-comparison-header reveal-fade-in">
                        <h2 className="sl-comparison-title">The Evolution of Human Resources</h2>
                        <p className="sl-comparison-sub">
                            Witness the transition from legacy limitations to the future of workforce intelligence.
                        </p>
                    </div>

                    <div className="sl-comparison-grid reveal-fade-in">
                        {/* Traditional HR */}
                        <div className="sl-trad-col">
                            <div className="sl-col-header">
                                <span className="material-symbols-outlined sl-col-icon">history</span>
                                <h3 className="sl-col-title">Traditional HR</h3>
                            </div>
                            <div className="sl-comp-items">
                                <div className="sl-comp-item">
                                    <div className="sl-comp-icon-wrap sl-trad-icon">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div>
                                        <h4 className="sl-comp-item-title">Paper Attendance</h4>
                                        <p className="sl-comp-item-desc">Manual punch-cards and handwritten logs prone to tampering and error.</p>
                                    </div>
                                </div>
                                <div className="sl-comp-item">
                                    <div className="sl-comp-icon-wrap sl-trad-icon">
                                        <span className="material-symbols-outlined">table_chart</span>
                                    </div>
                                    <div>
                                        <h4 className="sl-comp-item-title">Excel Spreadsheets</h4>
                                        <p className="sl-comp-item-desc">Disconnected data siloes with no real-time cross-functional visibility.</p>
                                    </div>
                                </div>
                                <div className="sl-comp-item">
                                    <div className="sl-comp-icon-wrap sl-trad-icon">
                                        <span className="material-symbols-outlined">timer_off</span>
                                    </div>
                                    <div>
                                        <h4 className="sl-comp-item-title">Manual Leave Tracking</h4>
                                        <p className="sl-comp-item-desc">Slow approval cycles and lack of self-service portals.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* StaffSpire Intelligence */}
                        <div className="sl-smart-col">
                            <div className="sl-smart-accent-line"></div>
                            <div className="sl-smart-float"></div>
                            <div className="sl-col-header">
                                <span className="material-symbols-outlined sl-col-icon sl-col-icon-primary sl-pulse">auto_awesome</span>
                                <h3 className="sl-col-title">StaffSpire Intelligence</h3>
                            </div>
                            <div className="sl-comp-items">
                                <div className="sl-comp-item">
                                    <div className="sl-comp-icon-wrap sl-smart-icon">
                                        <span className="material-symbols-outlined">bolt</span>
                                    </div>
                                    <div>
                                        <h4 className="sl-comp-item-title sl-bright-title">Full Automation</h4>
                                        <p className="sl-comp-item-desc sl-bright-desc">Workflow engines that handle the heavy lifting while you focus on people.</p>
                                    </div>
                                </div>
                                <div className="sl-comp-item">
                                    <div className="sl-comp-icon-wrap sl-smart-icon">
                                        <span className="material-symbols-outlined">query_stats</span>
                                    </div>
                                    <div>
                                        <h4 className="sl-comp-item-title sl-bright-title">Predictive Analytics</h4>
                                        <p className="sl-comp-item-desc sl-bright-desc">Identify attrition risks and high-potential talent before they emerge.</p>
                                    </div>
                                </div>
                                <div className="sl-comp-item">
                                    <div className="sl-comp-icon-wrap sl-smart-icon">
                                        <span className="material-symbols-outlined">dashboard</span>
                                    </div>
                                    <div>
                                        <h4 className="sl-comp-item-title sl-bright-title">Real-time Dashboard</h4>
                                        <p className="sl-comp-item-desc sl-bright-desc">Single-pane-of-glass visibility into the health of your entire organization.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────── */}
            <section className="sl-cta-section">
                <div className="sl-container">
                    <div className="sl-cta-card reveal-zoom-in">
                        <div className="sl-cta-top-line"></div>
                        <h2 className="sl-cta-title">Ready to Scale with Confidence?</h2>
                        <p className="sl-cta-sub">
                            Join thousands of organizations using StaffSpire to unlock their full human potential.
                        </p>
                        <div className="sl-cta-btns">
                            <button type="button" className="sl-btn-primary sl-btn-lg">Schedule a Strategic Call</button>
                            <button type="button" className="sl-btn-white sl-btn-lg">Download Solutions Brochure</button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default Solutions;
