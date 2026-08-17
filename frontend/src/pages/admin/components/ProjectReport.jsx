import React from "react";
import { createPortal } from "react-dom";
import { FaPrint, FaTimes } from "react-icons/fa";
import "../../../styles/projectReport.css";

const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const daysBetween = (d1, d2) => {
    if (!d1 || !d2) return 0;
    const a = new Date(d1), b = new Date(d2);
    if (isNaN(a) || isNaN(b)) return 0;
    return Math.max(0, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
};

export default function ProjectReport({
    isOpen,
    onClose,
    project = {},
    members = [],
    tasks = [],
    milestones = [],
    deptName = "—",
    managerName = "—",
    progress = 0,
    workloadList = []
}) {
    if (!isOpen) return null;

    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const generatedBy = user.name || user.email || "System Administrator";

    // --- Calculations ---
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const pendingTasks = tasks.filter(t => t.status !== "Completed").length;
    const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
    const onHoldTasks = tasks.filter(t => t.status === "On Hold").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = tasks.filter(t => new Date(t.deadline) < today && t.status !== "Completed").length;
    const onTimeTasks = tasks.filter(t => {
        if (t.status !== "Completed") return false;
        const comp = t.completion_date ? new Date(t.completion_date) : (t.updated_at ? new Date(t.updated_at) : null);
        if (!comp || !t.deadline) return true;
        return comp <= new Date(t.deadline);
    }).length;
    const lateTasks = completedTasks - onTimeTasks;

    const totalDuration = daysBetween(project.start_date, project.end_date);
    const actualCompDate = project.updated_at || project.end_date;

    const priCritical = tasks.filter(t => t.priority === "Critical").length;
    const priHigh = tasks.filter(t => t.priority === "High").length;
    const priMedium = tasks.filter(t => !t.priority || t.priority === "Medium").length;
    const priLow = tasks.filter(t => t.priority === "Low").length;

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === "Completed").length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const onTimeRate = completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : 0;
    const milestoneRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    let avgTaskDuration = 0;
    const completedWithDates = tasks.filter(t => t.status === "Completed" && t.start_date);
    if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, t) => {
            const end = t.completion_date || t.updated_at || t.deadline;
            return sum + daysBetween(t.start_date, end);
        }, 0);
        avgTaskDuration = Math.round(totalDays / completedWithDates.length);
    }

    const membersWithTasks = workloadList.filter(w => w.tasksCount > 0).length;
    const teamUtilization = members.length > 0 ? Math.round((membersWithTasks / members.length) * 100) : 0;

    // --- Observations ---
    const highlights = [];
    if (completionRate === 100) highlights.push("All tasks completed.");
    else if (completionRate >= 80) highlights.push(`${completionRate}% of tasks completed.`);
    if (milestoneRate === 100 && totalMilestones > 0) highlights.push("All milestones achieved.");
    if (onTimeRate >= 80 && completedTasks > 0) highlights.push(`${onTimeRate}% on-time delivery rate.`);
    if (highlights.length === 0) highlights.push("Project closed within scope.");

    const risks = [];
    if (overdueTasks > 0) risks.push(`${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''} at closure.`);
    if (lateTasks > 0) risks.push(`${lateTasks} task${lateTasks > 1 ? 's' : ''} completed past deadline.`);
    const overloaded = workloadList.filter(w => w.workloadPoints >= 10 || w.tasksCount >= 5);
    if (overloaded.length > 0) risks.push(`${overloaded.length} member${overloaded.length > 1 ? 's' : ''} had high workload.`);
    if (pendingTasks > 0 && progress < 100) risks.push(`${pendingTasks} task${pendingTasks > 1 ? 's' : ''} still incomplete.`);
    if (risks.length === 0) risks.push("No significant risks identified.");

    const recommendations = [];
    if (overdueTasks > 0) recommendations.push("Set up automated deadline reminders.");
    if (overloaded.length > 0) recommendations.push("Balance workload distribution across team.");
    if (avgTaskDuration > 14) recommendations.push("Break large tasks into smaller deliverables.");
    if (teamUtilization < 70) recommendations.push("Right-size team for better utilization.");
    
    const handlePrint = () => {
        const originalTitle = document.title;
        // Changes title to e.g. "Website_Redesign_PRJ001_Report" so it gets saved properly
        document.title = `${project.project_name ? project.project_name.replace(/\s+/g, '_') : 'Project'}_${project.project_code || 'Report'}`;
        window.print();
        document.title = originalTitle;
    };

    const reportContent = (
        <div className="report-overlay" onClick={onClose}>
            <div className="report-document" onClick={e => e.stopPropagation()}>

                {/* COVER */}
                <div className="report-cover">
                    <div className="cover-top-bar">
                        <span className="cover-date">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                        <span className="cover-brand">StaffSpire</span>
                    </div>

                    <div className="cover-doc-type">Project Completion Report</div>
                    <h1 className="cover-project-title">{project.project_name}</h1>
                    <div className="cover-project-code">{project.project_code} · {deptName} Department</div>

                    <div className="cover-meta-grid">
                        <div className="cover-meta-item">
                            <div className="cover-meta-label">Manager</div>
                            <div className="cover-meta-value">{managerName}</div>
                        </div>
                        <div className="cover-meta-item">
                            <div className="cover-meta-label">Department</div>
                            <div className="cover-meta-value">{deptName}</div>
                        </div>
                        <div className="cover-meta-item">
                            <div className="cover-meta-label">Period</div>
                            <div className="cover-meta-value">{fmtDate(project.start_date)} — {fmtDate(project.end_date)}</div>
                        </div>
                        <div className="cover-meta-item">
                            <div className="cover-meta-label">Status</div>
                            <div className="cover-meta-value">Completed</div>
                        </div>
                    </div>

                    <div className="cover-confidential">
                        Internal Use Only · {project.project_code}
                    </div>
                </div>

                {/* BODY */}
                <div className="report-body">

                    {/* 1. Summary */}
                    <div className="report-section">
                        <div className="report-section-header">
                            <h2 className="section-title">Summary</h2>
                        </div>
                        <div className="exec-summary-text">
                            This report covers <strong>{project.project_name}</strong> ({project.project_code}), managed by {managerName} under the {deptName} department. The project ran for {totalDuration} days ({fmtDate(project.start_date)} to {fmtDate(project.end_date)}) with {members.length} team member{members.length !== 1 ? "s" : ""}.
                            <br /><br />
                            Out of {totalTasks} task{totalTasks !== 1 ? "s" : ""}, {completedTasks} ({completionRate}%) were completed. {onTimeTasks} were delivered on time ({onTimeRate}% on-time rate).
                            {totalMilestones > 0 && <> {completedMilestones} of {totalMilestones} milestone{totalMilestones !== 1 ? "s" : ""} achieved ({milestoneRate}%).</>}
                        </div>
                    </div>

                    {/* 2. Project Details */}
                    <div className="report-section">
                        <div className="report-section-header">
                            <h2 className="section-title">Project Details</h2>
                        </div>
                        <div className="report-table-container">
                            <table className="report-table report-table-fixed">
                                <tbody>
                                    {[
                                        ["Project Name", project.project_name],
                                        ["Project Code", project.project_code],
                                        ["Department", deptName],
                                        ["Manager", managerName],
                                        ["Priority", project.priority || "Medium"],
                                        ["Start Date", fmtDate(project.start_date)],
                                        ["End Date", fmtDate(project.end_date)],
                                        ["Completed On", fmtDate(actualCompDate)],
                                        ["Duration", `${totalDuration} days`],
                                        ["Description", project.description || "—"]
                                    ].map(([label, value], i) => (
                                        <tr key={i}>
                                            <td className="rpt-label-cell">{label}</td>
                                            <td>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Task Summary */}
                    <div className="report-section">
                        <div className="report-section-header">
                            <h2 className="section-title">Task Summary</h2>
                        </div>

                        <div className="report-kpi-grid">
                            {[
                                { label: "Total", value: totalTasks },
                                { label: "Completed", value: completedTasks },
                                { label: "In Progress", value: inProgressTasks },
                                { label: "On Hold", value: onHoldTasks },
                                { label: "Overdue", value: overdueTasks },
                                { label: "On-Time", value: onTimeTasks }
                            ].map((kpi, i) => (
                                <div key={i} className="report-kpi-card">
                                    <div className="kpi-value">{kpi.value}</div>
                                    <div className="kpi-label">{kpi.label}</div>
                                </div>
                            ))}
                        </div>

                        {tasks.length > 0 && (
                            <div className="report-table-container">
                                <table className="report-table report-table-fixed">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "36px" }}>#</th>
                                            <th>Title</th>
                                            <th>Assignee</th>
                                            <th style={{ width: "72px" }}>Priority</th>
                                            <th style={{ width: "86px" }}>Status</th>
                                            <th style={{ width: "90px" }}>Start</th>
                                            <th style={{ width: "90px" }}>Due</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map((t, i) => (
                                            <tr key={t.id || i}>
                                                <td>{i + 1}</td>
                                                <td>{t.task_title}</td>
                                                <td>{t.employee_name || "—"}</td>
                                                <td>{t.priority || "Medium"}</td>
                                                <td>{t.status}</td>
                                                <td>{fmtDate(t.start_date)}</td>
                                                <td>{fmtDate(t.deadline)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 4. Team */}
                    <div className="report-section">
                        <div className="report-section-header">
                            <h2 className="section-title">Team ({members.length})</h2>
                        </div>

                        {members.length > 0 && (
                            <div className="report-table-container">
                                <table className="report-table report-table-fixed">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "36px" }}>#</th>
                                            <th>Name</th>
                                            <th>Dept</th>
                                            <th>Role</th>
                                            <th style={{ width: "50px" }}>Tasks</th>
                                            <th style={{ width: "50px" }}>Done</th>
                                            <th style={{ width: "110px" }}>Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workloadList.length > 0 ? workloadList.map((w, i) => {
                                            const compPct = w.workloadPoints > 0 ? Math.round((w.completedPoints / w.workloadPoints) * 100) : 0;
                                            const memberInfo = members.find(m => m.employee_id === w.id);
                                            return (
                                                <tr key={w.id || i}>
                                                    <td>{i + 1}</td>
                                                    <td>{w.name}</td>
                                                    <td>{memberInfo?.department || w.department || "—"}</td>
                                                    <td>{memberInfo?.designation || "—"}</td>
                                                    <td style={{ textAlign: "center" }}>{w.tasksCount}</td>
                                                    <td style={{ textAlign: "center" }}>{w.completedCount}</td>
                                                    <td>{compPct}%</td>
                                                </tr>
                                            );
                                        }) : members.map((m, i) => (
                                            <tr key={m.employee_id || i}>
                                                <td>{i + 1}</td>
                                                <td>{m.first_name} {m.last_name}</td>
                                                <td>{m.department || "—"}</td>
                                                <td>{m.designation || "—"}</td>
                                                <td style={{ textAlign: "center" }}>—</td>
                                                <td style={{ textAlign: "center" }}>—</td>
                                                <td>—</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 5. Milestones */}
                    {milestones.length > 0 && (
                        <div className="report-section">
                            <div className="report-section-header">
                                <h2 className="section-title">Milestones</h2>
                            </div>
                            <div className="report-table-container">
                                <table className="report-table report-table-fixed">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "36px" }}>#</th>
                                            <th>Milestone</th>
                                            <th>Due Date</th>
                                            <th style={{ width: "86px" }}>Status</th>
                                            <th>Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {milestones.map((ms, i) => (
                                            <tr key={ms.id || i}>
                                                <td>{i + 1}</td>
                                                <td>{ms.title || ms.name}</td>
                                                <td>{fmtDate(ms.due_date)}</td>
                                                <td>{ms.status}</td>
                                                <td>{ms.status === "Completed" ? fmtDate(ms.completion_date || ms.updated_at) : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 6. Metrics */}
                    <div className="report-section">
                        <div className="report-section-header">
                            <h2 className="section-title">Performance</h2>
                        </div>
                        <div className="perf-metrics-grid">
                            <div className="perf-metric-card">
                                <div className="perf-metric-value">{completionRate}%</div>
                                <div className="perf-metric-label">Task Completion</div>
                                <div className="perf-metric-detail">{completedTasks}/{totalTasks} tasks</div>
                            </div>
                            <div className="perf-metric-card">
                                <div className="perf-metric-value">{onTimeRate}%</div>
                                <div className="perf-metric-label">On-Time Rate</div>
                                <div className="perf-metric-detail">{onTimeTasks}/{completedTasks} on time</div>
                            </div>
                            <div className="perf-metric-card">
                                <div className="perf-metric-value">{avgTaskDuration}d</div>
                                <div className="perf-metric-label">Avg Duration</div>
                                <div className="perf-metric-detail">{completedWithDates.length} tasks measured</div>
                            </div>
                            <div className="perf-metric-card">
                                <div className="perf-metric-value">{teamUtilization}%</div>
                                <div className="perf-metric-label">Team Utilization</div>
                                <div className="perf-metric-detail">{membersWithTasks}/{members.length} active</div>
                            </div>
                            {totalMilestones > 0 && (
                                <div className="perf-metric-card">
                                    <div className="perf-metric-value">{milestoneRate}%</div>
                                    <div className="perf-metric-label">Milestones</div>
                                    <div className="perf-metric-detail">{completedMilestones}/{totalMilestones} achieved</div>
                                </div>
                            )}
                        </div>

                        <div className="rpt-priority-row">
                            {[
                                { label: "Critical", count: priCritical },
                                { label: "High", count: priHigh },
                                { label: "Medium", count: priMedium },
                                { label: "Low", count: priLow }
                            ].map((p, i) => (
                                <div key={i} className="rpt-priority-chip">
                                    <strong>{p.count}</strong> {p.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 7. Observations */}
                    <div className="report-section">
                        <div className="report-section-header">
                            <h2 className="section-title">Observations</h2>
                        </div>
                        <div className="report-obs-grid">
                            <div className="report-obs-card highlights">
                                <div className="obs-card-title">Highlights</div>
                                <ul className="obs-card-list">
                                    {highlights.map((h, i) => <li key={i}>{h}</li>)}
                                </ul>
                            </div>
                            <div className="report-obs-card risks">
                                <div className="obs-card-title">Risks</div>
                                <ul className="obs-card-list">
                                    {risks.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                            <div className="report-obs-card recommendations">
                                <div className="obs-card-title">Next Steps</div>
                                <ul className="obs-card-list">
                                    {recommendations.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="report-footer">
                    <div className="report-footer-block">
                        <strong>Generated</strong>
                        {new Date().toLocaleString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                        })}
                    </div>
                    <div className="report-footer-block">
                        <strong>By</strong>
                        {generatedBy}
                    </div>
                    <div className="report-footer-block">
                        <strong>Manager</strong>
                        {managerName}
                    </div>
                    <div className="report-footer-block">
                        <strong>Ref</strong>
                        RPT-{project.project_code}-{new Date().toISOString().slice(0, 10).replace(/-/g, "")}
                    </div>
                    <div className="report-footer-notice">
                        System generated report · Data reflects project state at time of generation
                    </div>
                </div>

            </div>

            {/* Toolbar */}
            <div className="report-toolbar" onClick={e => e.stopPropagation()}>
                <button className="btn-print-report" onClick={handlePrint}>
                    <FaPrint /> Print / Save PDF
                </button>
                <button className="btn-close-report" onClick={onClose}>
                    <FaTimes /> Close
                </button>
            </div>
        </div>
    );

    return createPortal(reportContent, document.body);
}
