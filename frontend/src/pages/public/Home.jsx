import Navbar from "../../components/public/Navbar";
import Hero from "../../components/public/Hero";
import StatsSection from "../../components/public/StatsSection";
import FeaturesSection from "../../components/public/FeaturesSection";
import WorkflowSection from "../../components/public/WorkflowSection";
import TrustedCarousel from "../../components/public/TrustedCarousel";
import CTASection from "../../components/public/CTASection";
import Footer from "../../components/public/Footer";
import { useScrollReveal } from "../../hooks/useScrollReveal";

function Home() {
    useScrollReveal();

    return (
        <div className="ss-public-body">
            <Navbar />
            <main className="ss-main-content">
                <Hero />
                <StatsSection />
                <FeaturesSection />
                <WorkflowSection />
                <TrustedCarousel />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}

export default Home;
