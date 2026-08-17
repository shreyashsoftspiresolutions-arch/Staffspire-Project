const brands = [
    { icon: "rocket_launch", name: "Velocity" },
    { icon: "hub", name: "Synapse" },
    { icon: "all_inclusive", name: "Infinity" },
    { icon: "auto_awesome", name: "Nova HR" },
    { icon: "cloud_sync", name: "Stratus" },
    { icon: "rocket_launch", name: "Velocity" },
    { icon: "hub", name: "Synapse" },
    { icon: "all_inclusive", name: "Infinity" },
    { icon: "auto_awesome", name: "Nova HR" },
    { icon: "cloud_sync", name: "Stratus" },
];

function TrustedCarousel() {
    return (
        <section className="ss-trusted-section">
            <p className="ss-trusted-label">Empowering the world's leading teams</p>
            <div className="ss-trusted-track-wrap">
                <div className="ss-trusted-track">
                    {brands.map((b, i) => (
                        <div key={`key-${i}` /* fixed by script */} className="ss-trusted-item">
                            <div className="ss-trusted-icon-box">
                                <span className="material-symbols-outlined">{b.icon}</span>
                            </div>
                            <span className="ss-trusted-name">{b.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default TrustedCarousel;
