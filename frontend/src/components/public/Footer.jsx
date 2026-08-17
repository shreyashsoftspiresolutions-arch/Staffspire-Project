import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="ss-footer">
            <div className="ss-footer-main">
                {/* Brand */}
                <div className="ss-footer-brand">
                    <Link to="/" className="ss-footer-logo">
                        <span className="material-symbols-outlined ss-footer-logo-icon">corporate_fare</span>
                        <span className="ss-footer-logo-text">StaffSpire</span>
                    </Link>
                    <p className="ss-footer-brand-desc">
                        Empowering organizations with intelligent HR tools to build better teams and faster workflows.
                    </p>
                    <div className="ss-footer-socials">
                        <a href="#" className="ss-footer-social">
                            <span className="material-symbols-outlined">language</span>
                        </a>
                        <a href="#" className="ss-footer-social">
                            <span className="material-symbols-outlined">share</span>
                        </a>
                        <a href="#" className="ss-footer-social">
                            <span className="material-symbols-outlined">public</span>
                        </a>
                    </div>
                </div>

                {/* Links */}
                <div className="ss-footer-links-grid">
                    <div className="ss-footer-col">
                        <h5 className="ss-footer-col-title">Product</h5>
                        <ul className="ss-footer-col-links">
                            <li><Link to="/features">Features</Link></li>
                            <li><a href="#">Pricing</a></li>
                            <li><a href="#">Integrations</a></li>
                            <li><a href="#">Enterprise</a></li>
                        </ul>
                    </div>
                    <div className="ss-footer-col">
                        <h5 className="ss-footer-col-title">Resources</h5>
                        <ul className="ss-footer-col-links">
                            <li><a href="#">Documentation</a></li>
                            <li><a href="#">Guides</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">API Reference</a></li>
                        </ul>
                    </div>
                    <div className="ss-footer-col">
                        <h5 className="ss-footer-col-title">Legal</h5>
                        <ul className="ss-footer-col-links">
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="ss-footer-bottom">
                <span>© 2026 Softspire. All rights reserved.</span>
            </div>
        </footer>
    );
}

export default Footer;
