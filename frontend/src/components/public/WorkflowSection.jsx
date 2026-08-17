import { useEffect, useRef } from "react";

const nodes = [
    { icon: "admin_panel_settings", label: "Admin" },
    { icon: "corporate_fare", label: "Departments" },
    { icon: "person", label: "Employees" },
    { icon: "schedule", label: "Attendance" },
    { icon: "flight_takeoff", label: "Leave" },
    { icon: "assignment", label: "Tasks" },
    { icon: "summarize", label: "Reports" },
    { icon: "insights", label: "Analytics" },
];

function WorkflowSection() {
    const intervalRef = useRef(null);

    useEffect(() => {
        let activeIndex = 0;

        intervalRef.current = setInterval(() => {
            const nodeEls = document.querySelectorAll(".ss-workflow-node-circle");
            nodeEls.forEach((el, i) => {
                if (i === activeIndex) {
                    el.classList.add("ss-node-active");
                } else {
                    el.classList.remove("ss-node-active");
                }
            });
            activeIndex = (activeIndex + 1) % nodeEls.length;
        }, 1500);

        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <section className="ss-workflow-section">
            <div className="ss-workflow-inner">
                <div className="ss-workflow-header reveal-fade-in">
                    <h2 className="ss-workflow-title">The Complete Lifecycle</h2>
                    <p className="ss-workflow-subtitle">
                        Seamless data flow from onboarding to high-level strategic planning.
                    </p>
                </div>

                <div className="ss-workflow-nodes">
                    {/* SVG connecting line */}
                    <svg className="ss-workflow-svg" viewBox="0 0 1200 60" fill="none" preserveAspectRatio="none">
                        <path
                            d="M0 30 C150 30 150 10 300 10 C450 10 450 50 600 50 C750 50 750 30 900 30 C1050 30 1050 10 1200 10"
                            stroke="#0050cb"
                            strokeWidth="2"
                            strokeDasharray="8 8"
                            opacity="0.3"
                        />
                    </svg>

                    {nodes.map((node, i) => (
                        <div
                            key={`key-${i}` /* fixed by script */}
                            className="ss-workflow-node reveal-fade-in"
                            style={{ transitionDelay: `${i * 80}ms` }}
                        >
                            <div className="ss-workflow-node-circle">
                                <span className="material-symbols-outlined">{node.icon}</span>
                            </div>
                            <span className="ss-workflow-node-label">{node.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default WorkflowSection;
