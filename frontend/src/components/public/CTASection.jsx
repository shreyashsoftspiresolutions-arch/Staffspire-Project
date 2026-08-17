import { Link } from "react-router-dom";

function CTASection() {
    return (
        <section className="ss-cta-section">
            <div className="ss-cta-box reveal-zoom-in">
                {/* Text Side */}
                <div className="ss-cta-content">
                    <h2 className="ss-cta-title">Ready to modernize your workforce?</h2>
                    <p className="ss-cta-desc">
                        Join 500+ forward-thinking organizations that chose StaffSpire to streamline their HR operations.
                    </p>
                    <div className="ss-cta-btns">
                        <Link to="/login" className="ss-cta-btn-solid">
                            Get Started Free
                        </Link>
                        <Link to="/login" className="ss-cta-btn-outline">
                            Book a Live Demo
                        </Link>
                    </div>
                </div>

                {/* Decorative rings */}
                <div className="ss-cta-rings">
                    <div className="ss-cta-ring ss-ring-outer">
                        <div className="ss-cta-ring ss-ring-mid">
                            <div className="ss-cta-ring ss-ring-inner">
                                <span className="material-symbols-outlined ss-cta-ring-icon">trending_up</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative blobs */}
                <div className="ss-cta-blob ss-cta-blob-br"></div>
                <div className="ss-cta-blob ss-cta-blob-tl"></div>
            </div>
        </section>
    );
}

export default CTASection;
