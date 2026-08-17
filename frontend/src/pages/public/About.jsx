import { Link } from "react-router-dom";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import aboutHeroImg from "../../assets/meeting.png";
import aboutBridgeImg from "../../assets/system_arch.png";
import "../../styles/about.css";

const specializations = [
    {
        title: "Full-Stack Development",
        desc: "Expertise in Java and Web technologies to build robust, enterprise-grade applications.",
        icon: "code"
    },
    {
        title: "AI Technologies",
        desc: "Integrating advanced artificial intelligence to automate processes and provide predictive insights.",
        icon: "psychology"
    },
    {
        title: "Mobile App Development",
        desc: "Creating seamless, high-performance mobile experiences for iOS and Android platforms.",
        icon: "smartphone"
    },
    {
        title: "Software Testing",
        desc: "Rigorous QA and automated testing frameworks to ensure zero-defect software delivery.",
        icon: "bug_report"
    },
    {
        title: "Digital Marketing",
        desc: "Strategic growth marketing to build brand presence and drive high-intent user traffic.",
        icon: "trending_up"
    },
    {
        title: "MERN Stack",
        desc: "Modern, scalable web solutions leveraging MongoDB, Express, React, and Node.js.",
        icon: "layers"
    }
];

function About() {
    useScrollReveal();

    return (
        <div className="ss-public-body">
            <Navbar />

            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="ab-hero">
                <div className="ab-hero-inner">
                    {/* Left: text */}
                    <div className="ab-hero-text reveal-fade-in">
                        <h1 className="ab-hero-title">
                            Scaling IT Potential &amp; Human Growth
                        </h1>
                        <p className="ab-hero-desc">
                            At SoftSpire Solutions, we empower growth by combining world-class training,
                            technical innovation, and strategic consulting. We guide students and professionals
                            from learning to career success while helping businesses scale with cutting-edge technology.
                        </p>
                        <div className="ab-hero-btns">
                            <button type="button" className="ab-btn-primary">Read Our Story</button>
                            <button type="button" className="ab-btn-outline">View Mission</button>
                        </div>
                    </div>

                    {/* Right: office image */}
                    <div className="ab-hero-visual reveal-fade-in" style={{ transitionDelay: "150ms" }}>
                        <div className="ab-hero-img-wrap">
                            <img src={aboutHeroImg} alt="SoftSpire Team Collaboration" className="ab-hero-img" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Company Story ─────────────────────────────────── */}
            <section className="ab-story reveal-fade-in">
                <div className="ab-story-inner">
                    {/* Left column */}
                    <div className="ab-story-left">
                        <span className="ab-story-tag">The SoftSpire Story</span>
                        <h2 className="ab-story-title">
                            Innovating at the intersection of Education and Technology.
                        </h2>
                    </div>

                    {/* Right column */}
                    <div className="ab-story-right">
                        <p className="ab-story-para">
                            Founded in 2025, SoftSpire Solutions was born from a vision to bridge the critical
                            gap between academic learning and industry demands. With a dedicated team of 11–50
                            experts, we provide high-impact IT Services and Consulting to help organizations
                            thrive in the digital age.
                        </p>
                        <p className="ab-story-para">
                            Beyond services, we are the creators of <strong>StaffSpire</strong>, our flagship
                            HRIS product designed to revolutionize human resource management through AI-driven
                            insights. Our ecosystem fosters an environment where aspiring tech professionals
                            and established enterprises converge to turn technological challenges into
                            competitive advantages.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Mission & Vision ──────────────────────────────── */}
            <section className="ab-mv-section">
                <div className="ab-mv-grid">
                    {/* Mission card (light) */}
                    <div className="ab-mission-card reveal-slide-left">
                        <div className="ab-mv-icon-box">
                            <span className="material-symbols-outlined ab-mv-icon">rocket_launch</span>
                        </div>
                        <h3 className="ab-mv-title">Our Mission</h3>
                        <p className="ab-mv-desc">
                            To empower students, freshers, and experienced professionals by guiding them from
                            foundational learning to career success, while delivering scalable IT solutions
                            that drive business growth.
                        </p>
                    </div>

                    {/* Vision card (blue/filled) */}
                    <div className="ab-vision-card reveal-slide-right">
                        <div className="ab-mv-icon-box ab-mv-icon-box-inv">
                            <span className="material-symbols-outlined ab-mv-icon">visibility</span>
                        </div>
                        <h3 className="ab-mv-title ab-mv-title-inv">Our Vision</h3>
                        <p className="ab-mv-desc ab-mv-desc-inv">
                            From Training to Tech – We Inspire
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Core Specializations ─────────────────────────── */}
            <section className="ab-spec-section">
                <div className="ab-container">
                    <div className="ab-spec-header reveal-fade-in">
                        <h2 className="ab-spec-title">Core Specializations</h2>
                        <p className="ab-spec-sub">
                            We provide end-to-end expertise across the most critical domains of modern technology.
                        </p>
                    </div>

                    <div className="ab-spec-grid">
                        {specializations.map((spec, idx) => (
                            <div
                                key={idx}
                                className={`ab-spec-card reveal-fade-in`}
                                style={{ transitionDelay: `${(idx % 3) * 80}ms` }}
                            >
                                <div className="ab-spec-icon-wrap">
                                    <span className="material-symbols-outlined ab-spec-icon">{spec.icon}</span>
                                </div>
                                <h4 className="ab-spec-name">{spec.title}</h4>
                                <p className="ab-spec-desc">{spec.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Bridging the Skill Gap ───────────────────────── */}
            <section className="ab-bridge-section">
                <div className="ab-bridge-inner">
                    {/* Left: tech stack image */}
                    <div className="ab-bridge-visual reveal-slide-left">
                        <div className="ab-bridge-img-wrap">
                            <img src={aboutBridgeImg} alt="SoftSpire Tech Stack" className="ab-bridge-img" />
                        </div>
                    </div>

                    {/* Right: text */}
                    <div className="ab-bridge-text reveal-slide-right">
                        <h2 className="ab-bridge-title">Bridging the Skill Gap</h2>
                        <p className="ab-bridge-desc">
                            Our intensive internship and training programs are designed to build practical,
                            industry-ready skills. We don't just teach code; we mentor professionals on how
                            to solve real-world problems using the latest technology stacks.
                        </p>
                        <ul className="ab-bridge-list">
                            <li className="ab-bridge-item">
                                <span className="material-symbols-outlined ab-bridge-check">check_circle</span>
                                Practical, project-based learning modules
                            </li>
                            <li className="ab-bridge-item">
                                <span className="material-symbols-outlined ab-bridge-check">check_circle</span>
                                Mentorship from seasoned industry experts
                            </li>
                            <li className="ab-bridge-item">
                                <span className="material-symbols-outlined ab-bridge-check">check_circle</span>
                                Internship opportunities with real product exposure
                            </li>
                        </ul>
                        <button type="button" className="ab-btn-primary">Explore Programs</button>
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────── */}
            <section className="ab-cta-section">
                <div className="ab-cta-inner reveal-fade-in">
                    <h2 className="ab-cta-title">Join the SoftSpire journey.</h2>
                    <p className="ab-cta-sub">
                        Experience the future of IT services and professional growth. Let's scale your potential together.
                    </p>
                    <div className="ab-cta-btns">
                        <button type="button" className="ab-cta-btn-white">Get Started Now</button>
                        <button type="button" className="ab-cta-btn-ghost">Contact Us</button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default About;
