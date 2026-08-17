import React, { useState, useEffect, useRef } from "react";
import { 
    FaProjectDiagram, FaUserPlus, FaTasks, FaCheckCircle, FaFlag, 
    FaClock, FaSearch, FaCalendarAlt, FaUserCircle, FaHistory, FaRocket, FaAward
} from "react-icons/fa";
import "../../../styles/projectTimeline.css";

// Relative time format helper
const getRelativeTime = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return "Recently";
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${Math.floor(diffInMonths / 12)}y ago`;
};

// Single Animated Timeline Card (uses IntersectionObserver for scroll pop-in)
function TimelineItem({ ev, idx, isLeft, isNewest }) {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        );
        if (cardRef.current) {
            observer.observe(cardRef.current);
        }
        return () => observer.disconnect();
    }, []);

    const cardContent = (
        <div 
            className={`timeline-event-card ${isVisible ? 'timeline-card-visible' : 'timeline-card-hidden'}`} 
            style={{ '--card-glow': ev.glow }}
        >
            <div className="card-header-top">
                <span className="card-category-badge" style={{ backgroundColor: ev.bg, color: ev.glow }}>
                    {ev.badge}
                </span>
                <span className="card-time-relative">{ev.relativeTime}</span>
            </div>
            <h4 className="card-title-main">{ev.title}</h4>
            <p className="card-desc-body">{ev.desc}</p>
            <div className="card-footer-meta">
                <span className="meta-date-exact">
                    <FaCalendarAlt size={13} color="#94a3b8" />
                    {ev.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="meta-author-tag">
                    <FaUserCircle size={15} color="#64748b" />
                    {ev.author || "System"}
                </span>
            </div>
        </div>
    );

    return (
        <div ref={cardRef} className="timeline-item-row">
            {/* Center Node Icon on Timeline Line */}
            <div className={`timeline-node-icon ${isNewest ? 'pulse-node' : ''}`} style={{ borderColor: ev.glow }}>
                {ev.icon}
            </div>

            {/* Left Column */}
            <div className="timeline-col-left">
                {isLeft && cardContent}
            </div>

            {/* Right Column */}
            <div className="timeline-col-right">
                {!isLeft && cardContent}
            </div>
        </div>
    );
}

export default function ProjectTimeline({ project = {}, deptName = "—", members = [], tasks = [], milestones = [], progress = 0 }) {
    const [searchQuery, setSearchQuery] = useState("");

    // Build rich chronological events array
    const events = [];

    // 1. Project Initialization (ALWAYS AT TOP: orderPriority = -100)
    const createdDate = project.created_at ? new Date(project.created_at) : new Date(project.start_date || Date.now());
    events.push({
        id: "proj-create",
        title: "Project Initialized",
        date: createdDate,
        relativeTime: getRelativeTime(createdDate),
        desc: `Project "${project.project_name}" (${project.project_code || 'ID'}) was officially initialized in the ${deptName} department.`,
        icon: <FaRocket color="#4f46e5" />,
        bg: "#e0e7ff",
        glow: "#4f46e5",
        type: "project",
        badge: "Lifecycle",
        author: project.manager_name || "Admin",
        orderPriority: -100,
        subIndex: 0
    });

    // 2. Members Joined
    members.forEach((m, idx) => {
        const joinDate = m.joined_at ? new Date(m.joined_at) : (project.created_at ? new Date(new Date(project.created_at).getTime() + 1000 * 60 * 10) : new Date());
        events.push({
            id: `mem-${m.employee_id || m.id || idx}`,
            title: "Team Member Added",
            date: joinDate,
            relativeTime: getRelativeTime(joinDate),
            desc: `${m.first_name || ''} ${m.last_name || ''} (${m.designation || 'Team Member'}) joined the project team to contribute to deliverables.`,
            icon: <FaUserPlus color="#0284c7" />,
            bg: "#e0f2fe",
            glow: "#0284c7",
            type: "member",
            badge: "Team",
            author: "Team Lead",
            orderPriority: 0,
            subIndex: idx
        });
    });

    // 3. Tasks Assigned & Completed
    tasks.forEach((t, idx) => {
        const assignDate = t.created_at ? new Date(t.created_at) : (t.start_date ? new Date(t.start_date) : new Date());
        events.push({
            id: `task-assign-${t.id || idx}`,
            title: "Task Assigned",
            date: assignDate,
            relativeTime: getRelativeTime(assignDate),
            desc: `Task "${t.task_title}" was assigned to ${t.employee_name || 'a team member'} with a ${t.priority || 'Medium'} priority rating.`,
            icon: <FaTasks color="#d97706" />,
            bg: "#fef3c7",
            glow: "#d97706",
            type: "task",
            badge: "Task",
            author: t.employee_name || "Employee",
            orderPriority: 0,
            subIndex: idx
        });

        if (t.status === "Completed") {
            const compDate = t.completion_date ? new Date(t.completion_date) : (t.updated_at ? new Date(t.updated_at) : new Date());
            events.push({
                id: `task-comp-${t.id || idx}`,
                title: "Task Completed 🎉",
                date: compDate,
                relativeTime: getRelativeTime(compDate),
                desc: `Task "${t.task_title}" was successfully completed and verified by ${t.employee_name || 'the assignee'}.`,
                icon: <FaCheckCircle color="#16a34a" />,
                bg: "#dcfce7",
                glow: "#16a34a",
                type: "task",
                badge: "Completed",
                author: t.employee_name || "Employee",
                orderPriority: 50,
                subIndex: idx
            });
        }
    });

    // 4. Milestones Added & Achieved
    milestones.forEach((ms, idx) => {
        const msCreateDate = ms.created_at ? new Date(ms.created_at) : createdDate;
        events.push({
            id: `ms-create-${ms.id || idx}`,
            title: "Milestone Scheduled",
            date: msCreateDate,
            relativeTime: getRelativeTime(msCreateDate),
            desc: `Milestone "${ms.title || ms.name}" was scheduled as a major project deliverable.`,
            icon: <FaFlag color="#7c3aed" />,
            bg: "#ede9fe",
            glow: "#7c3aed",
            type: "milestone",
            badge: "Milestone",
            author: "Project Manager",
            orderPriority: 0,
            subIndex: idx
        });

        if (ms.status === "Completed") {
            const msCompDate = ms.completion_date ? new Date(ms.completion_date) : (ms.updated_at ? new Date(ms.updated_at) : new Date());
            events.push({
                id: `ms-comp-${ms.id || idx}`,
                title: "Milestone Achieved 🏆",
                date: msCompDate,
                relativeTime: getRelativeTime(msCompDate),
                desc: `Milestone "${ms.title || ms.name}" reached 100% completion! Major project objective accomplished.`,
                icon: <FaAward color="#9333ea" />,
                bg: "#f3e8ff",
                glow: "#9333ea",
                type: "milestone",
                badge: "Achieved",
                author: "Project Team",
                orderPriority: 60,
                subIndex: idx
            });
        }
    });

    // 5. Project Completed (ALWAYS AT BOTTOM: orderPriority = 100)
    if (project.status === "Completed" || progress === 100) {
        const projCompDate = project.updated_at ? new Date(project.updated_at) : new Date(project.end_date || Date.now());
        events.push({
            id: "proj-comp",
            title: "Project Completed 🚀",
            date: projCompDate,
            relativeTime: getRelativeTime(projCompDate),
            desc: `Project "${project.project_name}" has reached 100% completion! All tasks and milestones finalized.`,
            icon: <FaCheckCircle color="#15803d" />,
            bg: "#dcfce7",
            glow: "#15803d",
            type: "project",
            badge: "Success",
            author: project.manager_name || "Manager",
            orderPriority: 100,
            subIndex: 0
        });
    }

    // Filter by search query, then sort strictly in chronological order (asc: earliest first, latest last)
    const filteredEvents = events.filter(ev => {
        const matchesSearch = !searchQuery || 
            ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            ev.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ev.author && ev.author.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    }).sort((a, b) => {
        // 1. Enforce absolute top/bottom priority (e.g. Project Initialized at top, Project Completed at bottom)
        if (a.orderPriority !== b.orderPriority && (a.orderPriority === -100 || b.orderPriority === -100 || a.orderPriority === 100 || b.orderPriority === 100)) {
            return a.orderPriority - b.orderPriority;
        }
        // 2. Sort by date ascending (chronological order)
        const timeDiff = a.date.getTime() - b.date.getTime();
        if (timeDiff !== 0) {
            return timeDiff;
        }
        // 3. If timestamps are identical, interleave round-robin by subIndex so they never group in solid category blocks
        if (a.subIndex !== b.subIndex) {
            return a.subIndex - b.subIndex;
        }
        return a.orderPriority - b.orderPriority;
    });

    return (
        <div className="timeline-container-premium">
            {/* Top Summary Stats Banner */}
            <div className="timeline-stats-banner">
                <div className="timeline-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
                        <FaHistory />
                    </div>
                    <div className="stat-content">
                        <h4>{events.length}</h4>
                        <span>Total Events</span>
                    </div>
                </div>

                <div className="timeline-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#f3e8ff", color: "#9333ea" }}>
                        <FaAward />
                    </div>
                    <div className="stat-content">
                        <h4>{milestones.filter(m => m.status === "Completed").length}/{milestones.length}</h4>
                        <span>Milestones Won</span>
                    </div>
                </div>

                <div className="timeline-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
                        <FaCheckCircle />
                    </div>
                    <div className="stat-content">
                        <h4>{tasks.filter(t => t.status === "Completed").length}/{tasks.length}</h4>
                        <span>Tasks Completed</span>
                    </div>
                </div>

                <div className="timeline-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
                        <FaUserCircle />
                    </div>
                    <div className="stat-content">
                        <h4>{members.length}</h4>
                        <span>Team Members</span>
                    </div>
                </div>
            </div>

            {/* Controls Bar (Search Only - Uncategorized Free Timeline) */}
            <div className="timeline-controls-bar" style={{ justifyContent: "flex-end" }}>
                <div className="timeline-search-box">
                    <FaSearch className="timeline-search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search timeline..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Timeline Track & Cards Area */}
            {filteredEvents.length === 0 ? (
                <div className="timeline-empty-state">
                    <FaClock size={44} color="#94a3b8" />
                    <h4>No timeline events found</h4>
                    <p>Try adjusting your search query above.</p>
                </div>
            ) : (
                <div className="timeline-track-area">
                    <div className="timeline-center-line" />
                    {filteredEvents.map((ev, idx) => (
                        <TimelineItem 
                            key={ev.id + idx} 
                            ev={ev} 
                            idx={idx} 
                            isLeft={idx % 2 === 0} 
                            isNewest={idx === filteredEvents.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
