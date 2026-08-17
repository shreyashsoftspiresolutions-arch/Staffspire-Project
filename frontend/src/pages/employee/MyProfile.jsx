import { useEffect, useState } from "react";
import axios from "axios";
import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);


function MyProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [team, setTeam] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Overview");


    const { data, isLoading } = useSWR("http://localhost:5000/api/employee/dashboard", fetcher);

    useEffect(() => {
        setLoading(isLoading && !data);
        if (data && data.success) {
            setProfile(data.employee);
            setTeam(data.team || []);
            setActivities(data.activities || []);
        }
    }, [data, isLoading]);

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ textAlign: "center", padding: "100px" }}>
                    <p style={{ fontSize: "18px", color: "#64748b" }}>Loading profile details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!profile) {
        return (
            <DashboardLayout>
                <div style={{ textAlign: "center", padding: "100px" }}>
                    <p style={{ fontSize: "18px", color: "#ef4444" }}>Failed to load profile information.</p>
                </div>
            </DashboardLayout>
        );
    }

    const initials = profile.name ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase() : "SA";
    const formattedJoinDate = profile.joining_date 
        ? new Date(profile.joining_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) 
        : "01 Jan 2020";

    const formatDateOfBirth = (dobString) => {
        if (!dobString) return "14 June 1995";
        try {
            const parts = dobString.split("-");
            if (parts.length === 3) {
                const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
                return date.toLocaleDateString("en-GB", { 
                    day: "2-digit", 
                    month: "long", 
                    year: "numeric",
                    timeZone: "UTC"
                });
            }
            const date = new Date(dobString);
            return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
        } catch {
            return dobString;
        }
    };

    const expertiseTags = profile.expertise 
        ? profile.expertise.split(",").map(s => s.trim())
        : ["System Architect", "Node.js", "Tailwind CSS", "React", "Cloud Infrastructure"];

    return (
        <DashboardLayout>
            <div className="profile-container-new">
                
                {/* Action Header */}
                <div className="profile-actions-bar">
                    <nav style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#737686" }}>
                        <span style={{ cursor: "pointer" }} onClick={() => navigate(-1)}>Directory</span>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                        <span style={{ color: "#191b23", fontWeight: 600 }}>Profile Details</span>
                    </nav>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button type="button" 
                            className="profile-btn-print" 
                            onClick={() => navigate('/employee/resignation')}
                            style={{ backgroundColor: "#ef4444", color: "white", border: "none" }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "white" }}>logout</span>
                            Apply for Resignation
                        </button>
                        <button type="button" 
                            className="profile-btn-print" 
                            onClick={() => navigate('/change-password')}
                            style={{ backgroundColor: "#4f46e5", color: "white", border: "none" }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "white" }}>lock</span>
                            Change Password
                        </button>
                        <button type="button" className="profile-btn-print" onClick={() => window.print()}>
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>print</span>
                            Print
                        </button>
                    </div>
                </div>

                {/* Bento Layout Grid */}
                <div className="profile-grid-new">
                    
                    {/* Left Column: Hero & Quick Info */}
                    <div className="profile-left-col">
                        
                        {/* Profile Summary Card */}
                        <div className="profile-card-new">
                            <div className="profile-avatar-wrapper">
                                <div className="profile-avatar-initials">
                                    {initials}  
                                </div>
                                <span className="profile-active-dot" title="Available"></span>
                            </div>
                            <h2 className="profile-name-title">{profile.name}</h2>
                            <p className="profile-designation-dept">{profile.designation} • {profile.department}</p>
                            
                            <div className="profile-contact-list">
                                <div className="profile-contact-item">
                                    <span className="material-symbols-outlined profile-contact-icon">mail</span>
                                    <div>
                                        <p className="profile-contact-label">Work Email</p>
                                        <p className="profile-contact-value">{profile.email}</p>
                                    </div>
                                </div>
                                <div className="profile-contact-item">
                                    <span className="material-symbols-outlined profile-contact-icon">call</span>
                                    <div>
                                        <p className="profile-contact-label">Phone Number</p>
                                        <p className="profile-contact-value">{profile.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* <div className="profile-action-btns">
                                <button type="button" className="profile-btn-message" onClick={() => alert("Direct messaging features coming soon!")}>Message</button>
                                <button type="button" className="profile-btn-more">
                                    <span className="material-symbols-outlined">more_horiz</span>
                                </button>
                            </div> */}
                        </div>

                        {/* Expertise Card
                        <div className="profile-expertise-card">
                            <h3 className="profile-section-title">
                                Expertise
                                <span className="material-symbols-outlined" style={{ color: "#737686", cursor: "pointer" }}>add</span>
                            </h3>
                            <div className="profile-expertise-tags">
                                {expertiseTags.map((tag, idx) => (
                                    <span key={idx} className={`profile-skill-tag ${idx === 0 ? 'primary' : 'secondary'}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div> */}

                    </div>

                    {/* Right Column: Detailed Info Sections & Tabs */}
                    <div className="profile-right-col">
                        
                        {/* Sticky Glassmorphic Navigation */}
                        <div className="profile-tabs-nav">
                            {["Overview", "Documents", "Payroll", "Activity"].map(tab => (
                                <button type="button" 
                                    key={tab}
                                    className={`profile-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content Canvas */}
                        {activeTab === "Overview" && (
                            <>
                                {/* General Information Card */}
                                <div className="profile-bento-card">
                                    <h3 className="profile-section-title" style={{ marginBottom: "24px" }}>General Information</h3>
                                    
                                    <div className="profile-bento-grid">
                                        <div className="profile-field-group">
                                            <span className="profile-field-label">Employee ID</span>
                                            <span className="profile-field-value">{profile.employee_id}</span>
                                        </div>
                                        <div className="profile-field-group">
                                            <span className="profile-field-label">Department</span>
                                            <span className="profile-field-value">{profile.department}</span>
                                        </div>
                                        <div className="profile-field-group">
                                            <span className="profile-field-label">Personal Email</span>
                                            <span className="profile-field-value">{profile.personal_email}</span>
                                        </div>
                                        <div className="profile-field-group">
                                            <span className="profile-field-label">Location</span>
                                            <span className="profile-field-value">{profile.location}</span>
                                        </div>
                                        <div className="profile-field-group">
                                            <span className="profile-field-label">Date of Birth</span>
                                            <span className="profile-field-value">{formatDateOfBirth(profile.date_of_birth)}</span>
                                        </div>
                                        <div className="profile-field-group">
                                            <span className="profile-field-label">Work Status</span>
                                            <span className="profile-status-badge">
                                                <span className="profile-status-dot"></span>
                                                {profile.employment_type || "Full-Time"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Employment Details Card */}
                                <div className="profile-bento-card">
                                    <h3 className="profile-section-title" style={{ marginBottom: "20px" }}>Employment Details</h3>
                                    
                                    <div className="profile-details-row">
                                        <div className="profile-detail-block">
                                            <p className="profile-detail-block-label">Join Date</p>
                                            <p className="profile-detail-block-value">{formattedJoinDate}</p>
                                        </div>
                                        <div className="profile-detail-block">
                                            <p className="profile-detail-block-label">Probation Period</p>
                                            <p className="profile-detail-block-value">{profile.probation_period}</p>
                                        </div>
                                        <div className="profile-detail-block">
                                            <p className="profile-detail-block-label">Reporting Manager</p>
                                            <p className="profile-detail-block-value">{profile.manager_name || "Anish Kumar"}</p>
                                        </div>
                                    </div>

                                    {/* Performance Metrics */}
                                    {/* <div className="profile-performance-section">
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "700" }}>
                                            <span style={{ color: "#191b23" }}>Recent Performance Metrics</span>
                                            <span style={{ color: "#004ac6" }}>94%</span>
                                        </div>
                                        <p style={{ fontSize: "12px", color: "#5e6572", margin: "4px 0 0 0" }}>Project Delivery Velocity</p>
                                        <div className="profile-performance-bar">
                                            <div className="profile-performance-fill" style={{ width: "94%" }}></div>
                                        </div>
                                    </div> */}
                                </div>

                                {/* Team Members Cards */}
                                <div className="profile-team-members">
                                    <h3 className="profile-section-title">Direct Team Members</h3>
                                    <div className="profile-team-grid">
                                        {team.map((member, index) => (
                                            <div key={`key-${index}` /* fixed */} className="profile-team-card">
                                                <div className="profile-team-avatar">
                                                    {member.initials}
                                                </div>
                                                <div className="profile-team-info">
                                                    <p className="profile-team-name">{member.name}</p>
                                                    <p className="profile-team-designation">{member.designation}</p>
                                                </div>
                                                <span className="material-symbols-outlined profile-team-arrow">chevron_right</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === "Documents" && (
                            <div className="profile-bento-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <h3 className="profile-section-title">Employee Documents</h3>
                                <p style={{ color: "#5e6572", fontSize: "14px" }}>Manage and view uploaded credentials, identity proofs, and academic certifications.</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
                                    {[`${profile.employee_id}_Contract.pdf`, `${profile.employee_id}_Identity_Verification.pdf`].map((doc, idx) => (
                                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#f3f3fe", border: "1px solid rgba(195,198,215,0.2)", borderRadius: "12px" }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#ba1a1a" }}>description</span>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#191b23" }}>{doc}</p>
                                                <p style={{ margin: 0, fontSize: "12px", color: "#5e6572" }}>Uploaded on 12 Jan 2024</p>
                                            </div>
                                            <span className="material-symbols-outlined" style={{ color: "#004ac6", cursor: "pointer" }}>download</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "Payroll" && (
                            <div className="profile-bento-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <h3 className="profile-section-title">Salary &amp; Payroll Summary</h3>
                                <p style={{ color: "var(--text-primary)", fontSize: "14px" }}>Confidential summary of monthly payouts, salary breakdown, and downloadable slips.</p>
                                <div style={{ background: "#faf8ff", border: "1px solid rgba(195,198,215,0.2)", borderRadius: "12px", padding: "24px", marginTop: "8px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(195,198,215,0.2)", paddingBottom: "16px" }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "12px", color: "#5e6572", textTransform: "uppercase" }}>Base Salary (Monthly)</p>
                                            <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "800", color: "#191b23" }}>
                                                {profile.salary ? `₹${Number(profile.salary).toLocaleString("en-IN")}` : "₹85,000"}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <p style={{ margin: 0, fontSize: "12px", color: "#5e6572", textTransform: "uppercase" }}>Payment Cycle</p>
                                            <p style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: "700", color: "#22c55e" }}>Direct Deposit</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "16px" }}>
                                        <span style={{ fontSize: "14px", fontWeight: "600" }}>June 2026 Payslip</span>
                                        <span style={{ color: "#004ac6", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span> Download PDF
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "Activity" && (
                            <div className="profile-bento-card">
                                <h3 className="profile-section-title" style={{ marginBottom: "20px" }}>Recent Activity Log</h3>
                                {activities.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        {activities.map((act, idx) => (
                                            <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${act.color}15`, color: act.color, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{act.icon}</span>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#191b23" }}>{act.action}</p>
                                                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#737686" }}>{act.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: "#5e6572", fontSize: "14px", margin: 0 }}>No recent activities (clock-ins, leaves, or tasks) logged in the system.</p>
                                )}
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </DashboardLayout>
    );
}

export default MyProfile;
