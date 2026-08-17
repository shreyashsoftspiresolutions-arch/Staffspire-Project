import { Link, useLocation } from "react-router-dom";

function Navbar() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header className="ss-navbar">
            {/* Logo */}
            <Link to="/" className="ss-nav-logo">
                <img className="logo_public" src="../src/assets/Softspire_Logo.png" alt="" />
            </Link>

            {/* Nav Links */}
            <nav className="ss-nav-links">
                <Link to="/" className={`ss-nav-link ${isActive("/") ? "ss-nav-link-active" : ""}`}>Home</Link>
                <Link to="/features" className={`ss-nav-link ${isActive("/features") ? "ss-nav-link-active" : ""}`}>Features</Link>
                <Link to="/solutions" className={`ss-nav-link ${isActive("/solutions") ? "ss-nav-link-active" : ""}`}>Solutions</Link>
                <Link to="/about" className={`ss-nav-link ${isActive("/about") ? "ss-nav-link-active" : ""}`}>About</Link>
                <Link to="/contact" className={`ss-nav-link ${isActive("/contact") ? "ss-nav-link-active" : ""}`}>Contact</Link>
            </nav>

            {/* Auth Buttons */}
            <div className="ss-nav-actions">
                <Link to="/login" className="ss-nav-login">Login</Link>
                <Link to="/login" className="ss-nav-cta">Get Started</Link>
            </div>
        </header>
    );
}

export default Navbar;
