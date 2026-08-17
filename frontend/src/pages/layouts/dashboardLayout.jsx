import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

function DashboardLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [themeClass, setThemeClass] = useState("");

    useEffect(() => {
        const force = localStorage.getItem("forcePasswordChange");
        if (force === "true" && location.pathname !== "/change-password") {
            navigate("/change-password");
        }

        // Apply theme from settings
        const user = JSON.parse(localStorage.getItem("user:v1")) || {};
        const userKey = user.email || user.id || user._id || "default";
        const settings = JSON.parse(localStorage.getItem(`staffspire_settings:v1:${userKey}`)) || JSON.parse(localStorage.getItem("staffspire_settings:v1")) || {};
        const theme = settings.theme || "system";
        
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-amber');

        if (theme !== "system") {
            setThemeClass(`theme-${theme}`);
            document.body.classList.add(`theme-${theme}`);
        } else {
            setThemeClass("");
        }
    }, [location.pathname, navigate]);

    return (
        <div className={`layout-container ${themeClass}`}>
            <Header />
            <div className="dashboard-container">
                <Sidebar />
                <div className="main-content">
                    <main className="content">
                        {children}
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout;