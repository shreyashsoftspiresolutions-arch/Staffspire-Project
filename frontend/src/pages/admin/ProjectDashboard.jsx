import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import useSWR from "swr";
import { Chart, registerables } from "chart.js";
import DashboardLayout from "../layouts/DashboardLayout";
import { 
    FaFolder, FaCheckCircle, FaPauseCircle, FaExclamationTriangle, 
    FaChartLine, FaPlus, FaEllipsisH, FaSearch, FaFilter, FaCalendarAlt, 
    FaChartBar, FaFileAlt, FaFilePdf, FaFileExcel, FaFileCsv, FaDownload, FaArrowLeft, FaArrowRight
} from "react-icons/fa";

Chart.register(...registerables);

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

function ProjectDashboard() {
    const token = localStorage.getItem("token");
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("analytics"); // "analytics", "calendar", "reports"
    
    // Filter states
    const [filterDept, setFilterDept] = useState("ALL");
    const [filterManager, setFilterManager] = useState("ALL");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [calendarDate, setCalendarDate] = useState(new Date());

    // Fetch analytics
    const { data: analyticsData, isLoading: analyticsLoading } = useSWR(token ? "http://localhost:5000/api/projects/analytics" : null, fetcher);
    // Fetch projects
    const { data: projectsData, isLoading: projectsLoading } = useSWR(token ? "http://localhost:5000/api/projects" : null, fetcher);
    // Fetch departments
    const { data: deptData } = useSWR(token ? "http://localhost:5000/api/departments" : null, fetcher);
    // Fetch employees
    const { data: empData } = useSWR(token ? "http://localhost:5000/api/employees" : null, fetcher);

    const stats = analyticsData?.stats || { total: 0, active: 0, completed: 0, on_hold: 0, overdue: 0, avg_progress: 0 };
    const projects = projectsData?.projects || [];
    const departments = Array.isArray(deptData) ? deptData : (deptData?.departments || []);
    const employees = Array.isArray(empData) ? empData : (empData?.employees || []);

    const getDeptName = (id) => {
        if (!id) return "Cross-Functional";
        const found = departments.find(d => String(d.id) === String(id) || d.department_name === id || d.id === id || String(d.department_name).toLowerCase() === String(id).toLowerCase());
        return found ? found.department_name : (isNaN(id) ? id : "Unknown");
    };

    // Filter projects dynamically
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.project_name.toLowerCase().includes(search.toLowerCase()) || 
            (p.project_code && p.project_code.toLowerCase().includes(search.toLowerCase()));
        const matchesDept = filterDept === "ALL" || String(p.department_id) === String(filterDept) || getDeptName(p.department_id) === filterDept;
        const matchesMgr = filterManager === "ALL" || String(p.manager_id) === String(filterManager) || p.manager_id === filterManager;
        const matchesDateFrom = !filterDateFrom || new Date(p.start_date) >= new Date(filterDateFrom);
        const matchesDateTo = !filterDateTo || new Date(p.end_date) <= new Date(filterDateTo);
        return matchesSearch && matchesDept && matchesMgr && matchesDateFrom && matchesDateTo;
    });

    // Chart refs & instances
    const deptChartRef = useRef(null);
    const statusChartRef = useRef(null);
    const prodChartRef = useRef(null);
    const trendChartRef = useRef(null);
    const deptChartInstance = useRef(null);
    const statusChartInstance = useRef(null);
    const prodChartInstance = useRef(null);
    const trendChartInstance = useRef(null);

    useEffect(() => {
        if (viewMode !== "analytics" || projectsLoading) return;

        // Dynamic chart data from filteredProjects
        const deptNames = departments.length > 0 ? departments.map(d => d.department_name) : ["General"];
        const deptCounts = deptNames.map(name => filteredProjects.filter(p => getDeptName(p.department_id) === name).length);
        
        const activeCount = filteredProjects.filter(p => p.status !== 'Completed' && p.status !== 'Overdue').length;
        const completedCount = filteredProjects.filter(p => p.status === 'Completed').length;
        const onHoldCount = filteredProjects.filter(p => p.status === 'On Hold').length;
        const overdueCount = filteredProjects.filter(p => p.status === 'Overdue' || (new Date(p.end_date) < new Date() && p.status !== 'Completed')).length;

        // 1. Department Distribution (Doughnut)
        if (deptChartRef.current) {
            const ctxDonut = deptChartRef.current.getContext('2d');
            if (deptChartInstance.current) deptChartInstance.current.destroy();

            deptChartInstance.current = new Chart(ctxDonut, {
                type: 'doughnut',
                data: {
                    labels: deptNames,
                    datasets: [{
                        data: deptCounts,
                        backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4'],
                        borderWidth: 0, hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '75%',
                    plugins: { legend: { position: 'right' } }
                }
            });
        }

        // 2. Project Statuses (Bar)
        if (statusChartRef.current) {
            const ctxBar = statusChartRef.current.getContext('2d');
            if (statusChartInstance.current) statusChartInstance.current.destroy();

            statusChartInstance.current = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Active', 'Completed', 'On Hold', 'Overdue'],
                    datasets: [{
                        label: 'Projects',
                        data: [activeCount, completedCount, onHoldCount, overdueCount],
                        backgroundColor: ['#3b82f6', '#22c55e', '#6b7280', '#ef4444'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        // 3. Team Productivity (Bar)
        if (prodChartRef.current) {
            const activeByDept = deptNames.map(name => filteredProjects.filter(p => getDeptName(p.department_id) === name && p.status !== 'Completed').length);
            const completedByDept = deptNames.map(name => filteredProjects.filter(p => getDeptName(p.department_id) === name && p.status === 'Completed').length);
            
            const ctxProd = prodChartRef.current.getContext('2d');
            if (prodChartInstance.current) prodChartInstance.current.destroy();

            prodChartInstance.current = new Chart(ctxProd, {
                type: 'bar',
                data: {
                    labels: deptNames,
                    datasets: [
                        { label: 'Active Projects', data: activeByDept, backgroundColor: '#3b82f6', borderRadius: 4 },
                        { label: 'Completed Projects', data: completedByDept, backgroundColor: '#10b981', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        // 4. Deadline Trend (Line)
        if (trendChartRef.current) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const deadlineCounts = new Array(12).fill(0);
            filteredProjects.forEach(p => {
                if (p.end_date) {
                    const m = new Date(p.end_date).getMonth();
                    if (m >= 0 && m < 12) deadlineCounts[m]++;
                }
            });

            const ctxTrend = trendChartRef.current.getContext('2d');
            if (trendChartInstance.current) trendChartInstance.current.destroy();

            trendChartInstance.current = new Chart(ctxTrend, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Project Deadlines',
                        data: deadlineCounts,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#fff',
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        return () => {
            if (deptChartInstance.current) deptChartInstance.current.destroy();
            if (statusChartInstance.current) statusChartInstance.current.destroy();
            if (prodChartInstance.current) prodChartInstance.current.destroy();
            if (trendChartInstance.current) trendChartInstance.current.destroy();
        };
    }, [viewMode, projectsLoading, filteredProjects, departments]);

    // Export Handlers
    const handleExportCSV = (reportTitle = "Projects_Report") => {
        const headers = ["Project Name", "Code", "Department", "Status", "Start Date", "End Date", "Progress (%)"];
        const rows = filteredProjects.map(p => [
            `"${p.project_name}"`, `"${p.project_code || ''}"`, `"${getDeptName(p.department_id)}"`, `"${p.status}"`,
            `"${new Date(p.start_date).toLocaleDateString()}"`, `"${new Date(p.end_date).toLocaleDateString()}"`, p.completion_percentage || 0
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `StaffSpire_${reportTitle}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = (reportTitle = "Projects_Report") => {
        let tableHtml = `<table border="1"><tr><th>Project Name</th><th>Code</th><th>Department</th><th>Status</th><th>Start Date</th><th>End Date</th><th>Progress</th></tr>`;
        filteredProjects.forEach(p => {
            tableHtml += `<tr><td>${p.project_name}</td><td>${p.project_code || ''}</td><td>${getDeptName(p.department_id)}</td><td>${p.status}</td><td>${new Date(p.start_date).toLocaleDateString()}</td><td>${new Date(p.end_date).toLocaleDateString()}</td><td>${p.completion_percentage || 0}%</td></tr>`;
        });
        tableHtml += `</table>`;
        const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `StaffSpire_${reportTitle}_${new Date().toISOString().slice(0,10)}.xls`;
        link.click();
    };

    const handleExportPDF = (reportTitle = "Comprehensive Projects Report") => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>StaffSpire ${reportTitle}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 30px; color: #1e293b; }
                    h1 { color: #4f46e5; margin-bottom: 5px; }
                    p { color: #64748b; margin-top: 0; margin-bottom: 20px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
                    th { background-color: #f8fafc; color: #334155; font-weight: 700; }
                    tr:nth-child(even) { background-color: #fcfcfd; }
                </style>
            </head>
            <body>
                <h1>StaffSpire ${reportTitle}</h1>
                <p>Generated on ${new Date().toLocaleString()} | Filtered Projects: ${filteredProjects.length}</p>
                <table>
                    <thead>
                        <tr><th>Project Name</th><th>Code</th><th>Department</th><th>Status</th><th>Start Date</th><th>End Date</th><th>Progress</th></tr>
                    </thead>
                    <tbody>
                        ${filteredProjects.map(p => `<tr><td><strong>${p.project_name}</strong></td><td>${p.project_code || ''}</td><td>${getDeptName(p.department_id)}</td><td>${p.status}</td><td>${new Date(p.start_date).toLocaleDateString()}</td><td>${new Date(p.end_date).toLocaleDateString()}</td><td>${p.completion_percentage || 0}%</td></tr>`).join('')}
                    </tbody>
                </table>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Calendar Grid Generator
    const renderCalendarGrid = () => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const weeks = [];
        let currentWeek = [];
        for (let i = 0; i < firstDay; i++) currentWeek.push(null);
        
        for (let day = 1; day <= daysInMonth; day++) {
            currentWeek.push(new Date(year, month, day));
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) currentWeek.push(null);
            weeks.push(currentWeek);
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        const upcomingDeliveries = filteredProjects.filter(p => {
            const diff = (new Date(p.end_date) - new Date()) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7 && p.status !== 'Completed';
        });

        return (
            <div style={{ background: "white", borderRadius: "14px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.5rem" }}>
                            {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <span style={{ fontSize: "13px", padding: "4px 10px", background: "#e0f2fe", color: "#0369a1", borderRadius: "20px", fontWeight: "700" }}>
                            {filteredProjects.length} Projects in View
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button 
                            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <FaArrowLeft size={12} /> Prev
                        </button>
                        <button 
                            onClick={() => setCalendarDate(new Date())}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", cursor: "pointer", fontWeight: "600", color: "#334155" }}
                        >
                            Today
                        </button>
                        <button 
                            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            Next <FaArrowRight size={12} />
                        </button>
                    </div>
                </div>

                {/* Upcoming Deliveries Banner */}
                <div style={{ marginBottom: "20px", background: "#fef3c7", border: "1px solid #fde047", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
                    <FaExclamationTriangle color="#d97706" size={22} />
                    <div>
                        <div style={{ fontWeight: "700", color: "#92400e", fontSize: "14px" }}>Upcoming Deliveries & Milestones (Next 7 Days)</div>
                        <div style={{ fontSize: "13px", color: "#b45309", marginTop: "2px" }}>
                            {upcomingDeliveries.length > 0 ? (
                                upcomingDeliveries.map(p => `${p.project_name} (Due: ${new Date(p.end_date).toLocaleDateString()})`).join(" • ")
                            ) : (
                                "No critical deliverables due in the next 7 days."
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px" }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                        <div key={dayName} style={{ textAlign: "center", fontWeight: "700", color: "#64748b", padding: "10px 0", background: "#f8fafc", borderRadius: "6px", fontSize: "13px" }}>
                            {dayName}
                        </div>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
                    {weeks.map((week, wIdx) => 
                        week.map((dateObj, dIdx) => {
                            if (!dateObj) {
                                return <div key={`empty-${wIdx}-${dIdx}`} style={{ minHeight: "110px", background: "#f8fafc", borderRadius: "8px", opacity: 0.5 }}></div>;
                            }
                            const dateStr = dateObj.toISOString().slice(0, 10);
                            const isToday = dateStr === todayStr;
                            
                            const dayProjectsEnd = filteredProjects.filter(p => p.end_date && p.end_date.slice(0, 10) === dateStr);
                            const dayProjectsStart = filteredProjects.filter(p => p.start_date && p.start_date.slice(0, 10) === dateStr);

                            return (
                                <div key={dateStr} style={{ minHeight: "110px", background: isToday ? "#eff6ff" : "white", border: isToday ? "2px solid #3b82f6" : "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                        <span style={{ fontWeight: isToday ? "800" : "600", color: isToday ? "#1d4ed8" : "#334155", fontSize: "14px" }}>{dateObj.getDate()}</span>
                                        {isToday && <span style={{ fontSize: "10px", background: "#3b82f6", color: "white", padding: "1px 6px", borderRadius: "10px", fontWeight: "700" }}>TODAY</span>}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto", maxHeight: "80px" }}>
                                        {dayProjectsEnd.map(p => (
                                            <div key={`end-${p.id}`} title={`Deadline: ${p.project_name}`} style={{ fontSize: "11px", background: "#fee2e2", color: "#b91c1c", padding: "4px 6px", borderRadius: "4px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                🎯 Due: {p.project_name}
                                            </div>
                                        ))}
                                        {dayProjectsStart.map(p => (
                                            <div key={`start-${p.id}`} title={`Start: ${p.project_name}`} style={{ fontSize: "11px", background: "#dcfce7", color: "#15803d", padding: "4px 6px", borderRadius: "4px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                🚀 Start: {p.project_name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    // Reports Suite Generator
    const renderReportsSuite = () => {
        const reportTypes = [
            { id: "summary", title: "Project Summary Report", desc: "High-level overview of all active, completed, and overdue project metrics." },
            { id: "team", title: "Team & Manager Report", desc: "Cross-functional analysis of department allocations and managerial assignments." },
            { id: "progress", title: "Progress & Milestone Report", desc: "Detailed breakdown of completion rates and milestone delivery status." },
            { id: "completion", title: "Project Completion Audit", desc: "Audit log of finished projects, actual delivery schedules, and efficiency metrics." }
        ];

        return (
            <div>
                <div style={{ marginBottom: "20px", background: "white", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                    <h3 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "1.3rem" }}>Comprehensive Reports Suite</h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Generate, view, and export detailed executive reports in PDF, Excel, or CSV format. Filter selections applied above will automatically tailor your exported reports.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                    {reportTypes.map(rep => (
                        <div key={rep.id} style={{ background: "white", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                    <div style={{ background: "#e0e7ff", padding: "10px", borderRadius: "10px", color: "#4f46e5" }}>
                                        <FaFileAlt size={22} />
                                    </div>
                                    <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1.1rem" }}>{rep.title}</h4>
                                </div>
                                <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "20px" }}>{rep.desc}</p>
                            </div>
                            <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                                <button 
                                    onClick={() => handleExportPDF(rep.title)}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
                                >
                                    <FaFilePdf /> PDF
                                </button>
                                <button 
                                    onClick={() => handleExportExcel(rep.title)}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
                                >
                                    <FaFileExcel /> Excel
                                </button>
                                <button 
                                    onClick={() => handleExportCSV(rep.title)}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
                                >
                                    <FaFileCsv /> CSV
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="attendance-page-container" style={{ padding: "24px", maxWidth: "1500px", margin: "0 auto" }}>
                {/* Header & View Mode Navigation */}
                <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <h1 className="page-title" style={{ margin: "0 0 4px 0", color: "#0f172a", fontSize: "1.8rem" }}>Project Intelligence & Analytics</h1>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Monitor executive KPIs, visualize productivity trends, manage calendars, and generate customized reports.</p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", background: "#f1f5f9", padding: "6px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <button 
                            onClick={() => setViewMode("analytics")}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px", border: "none", background: viewMode === "analytics" ? "white" : "transparent", color: viewMode === "analytics" ? "var(--primary, #4f46e5)" : "#64748b", fontWeight: "700", cursor: "pointer", boxShadow: viewMode === "analytics" ? "0 2px 4px rgba(0,0,0,0.06)" : "none", transition: "all 0.2s" }}
                        >
                            <FaChartBar /> Analytics
                        </button>
                        <button 
                            onClick={() => setViewMode("calendar")}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px", border: "none", background: viewMode === "calendar" ? "white" : "transparent", color: viewMode === "calendar" ? "var(--primary, #4f46e5)" : "#64748b", fontWeight: "700", cursor: "pointer", boxShadow: viewMode === "calendar" ? "0 2px 4px rgba(0,0,0,0.06)" : "none", transition: "all 0.2s" }}
                        >
                            <FaCalendarAlt /> Calendar
                        </button>
                        <button 
                            onClick={() => setViewMode("reports")}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px", border: "none", background: viewMode === "reports" ? "white" : "transparent", color: viewMode === "reports" ? "var(--primary, #4f46e5)" : "#64748b", fontWeight: "700", cursor: "pointer", boxShadow: viewMode === "reports" ? "0 2px 4px rgba(0,0,0,0.06)" : "none", transition: "all 0.2s" }}
                        >
                            <FaFileAlt /> Reports Suite
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div style={{ background: "white", padding: "16px 20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "#334155" }}>
                        <FaFilter color="var(--primary, #4f46e5)" /> Dynamic Filters:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, justifyContent: "flex-end" }}>
                        <select 
                            value={filterDept} 
                            onChange={e => setFilterDept(e.target.value)}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#334155", outline: "none", background: "#f8fafc" }}
                        >
                            <option value="ALL">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.department_name}>{d.department_name}</option>
                            ))}
                        </select>
                        <select 
                            value={filterManager} 
                            onChange={e => setFilterManager(e.target.value)}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#334155", outline: "none", background: "#f8fafc" }}
                        >
                            <option value="ALL">All Managers</option>
                            {employees.filter(e => e.role === "Manager" || e.role === "Admin" || e.designation?.toLowerCase().includes("manager")).map(e => (
                                <option key={e.employee_id} value={e.employee_id}>{e.first_name} {e.last_name}</option>
                            ))}
                        </select>
                        <input 
                            type="date" 
                            title="From Date"
                            value={filterDateFrom} 
                            onChange={e => setFilterDateFrom(e.target.value)}
                            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#334155", outline: "none", background: "#f8fafc" }}
                        />
                        <input 
                            type="date" 
                            title="To Date"
                            value={filterDateTo} 
                            onChange={e => setFilterDateTo(e.target.value)}
                            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#334155", outline: "none", background: "#f8fafc" }}
                        />
                        {(filterDept !== "ALL" || filterManager !== "ALL" || filterDateFrom || filterDateTo) && (
                            <button 
                                onClick={() => { setFilterDept("ALL"); setFilterManager("ALL"); setFilterDateFrom(""); setFilterDateTo(""); }}
                                style={{ padding: "8px 14px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                    <div style={{ background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>Total Projects</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            {filteredProjects.length} <FaFolder style={{ color: "#4f8cff", fontSize: "20px" }} />
                        </div>
                    </div>
                    <div style={{ background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>Active</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            {filteredProjects.filter(p => p.status !== 'Completed' && p.status !== 'Overdue').length} <FaChartLine style={{ color: "#3b82f6", fontSize: "20px" }} />
                        </div>
                    </div>
                    <div style={{ background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>Completed</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            {filteredProjects.filter(p => p.status === 'Completed').length} <FaCheckCircle style={{ color: "#22c55e", fontSize: "20px" }} />
                        </div>
                    </div>
                    <div style={{ background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>On Hold</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            {filteredProjects.filter(p => p.status === 'On Hold').length} <FaPauseCircle style={{ color: "#6b7280", fontSize: "20px" }} />
                        </div>
                    </div>
                    <div style={{ background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>Overdue</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            {filteredProjects.filter(p => p.status === 'Overdue' || (new Date(p.end_date) < new Date() && p.status !== 'Completed')).length} <FaExclamationTriangle style={{ color: "#ef4444", fontSize: "20px" }} />
                        </div>
                    </div>
                    <div style={{ background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>Avg Progress</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                            {filteredProjects.length > 0 ? Math.round(filteredProjects.reduce((acc, p) => acc + (p.completion_percentage || 0), 0) / filteredProjects.length) : 0}%
                        </div>
                    </div>
                </div>

                {/* View Content */}
                {viewMode === "analytics" && (
                    <div>
                        {/* 2x2 Charts Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px", marginBottom: "28px" }}>
                            <div className="bento-card" style={{ height: "340px", background: "white", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                                <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "1.1rem" }}>Department Distribution</h3>
                                <div style={{ position: "relative", height: "calc(100% - 40px)" }}>
                                    <canvas ref={deptChartRef}></canvas>
                                </div>
                            </div>
                            <div className="bento-card" style={{ height: "340px", background: "white", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                                <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "1.1rem" }}>Projects by Status</h3>
                                <div style={{ position: "relative", height: "calc(100% - 40px)" }}>
                                    <canvas ref={statusChartRef}></canvas>
                                </div>
                            </div>
                            <div className="bento-card" style={{ height: "340px", background: "white", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                                <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "1.1rem" }}>Team Productivity (Active vs Completed)</h3>
                                <div style={{ position: "relative", height: "calc(100% - 40px)" }}>
                                    <canvas ref={prodChartRef}></canvas>
                                </div>
                            </div>
                            <div className="bento-card" style={{ height: "340px", background: "white", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                                <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "1.1rem" }}>Deadline Trend by Month</h3>
                                <div style={{ position: "relative", height: "calc(100% - 40px)" }}>
                                    <canvas ref={trendChartRef}></canvas>
                                </div>
                            </div>
                        </div>

                        {/* Projects Table */}
                        <div className="bento-card" style={{ background: "white", padding: "24px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                                <h3 style={{ margin: 0, color: "#1e293b" }}>Filtered Active Projects</h3>
                                <div className="search-box" style={{ width: "260px", display: "flex", alignItems: "center", background: "#f8fafc", padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <FaSearch style={{ color: "#94a3b8", marginRight: "8px" }} />
                                    <input 
                                        type="text" placeholder="Search projects..." 
                                        value={search} onChange={e => setSearch(e.target.value)}
                                        style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "14px" }}
                                    />
                                </div>
                            </div>

                            <div className="table-container-custom" style={{ overflowX: "auto" }}>
                                <table className="employee-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                                            <th style={{ padding: "14px 12px", color: "#334155" }}>Project</th>
                                            <th style={{ padding: "14px 12px", color: "#334155" }}>Department</th>
                                            <th style={{ padding: "14px 12px", color: "#334155" }}>Status</th>
                                            <th style={{ padding: "14px 12px", color: "#334155" }}>Timeline</th>
                                            <th style={{ padding: "14px 12px", color: "#334155" }}>Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectsLoading ? (
                                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading projects...</td></tr>
                                        ) : filteredProjects.length === 0 ? (
                                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No projects match the current filter criteria.</td></tr>
                                        ) : filteredProjects.map(p => (
                                            <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                <td style={{ padding: "12px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{ background: p.project_color || "#4f8cff", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                                            <FaFolder />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: "600", color: "#1e293b" }}>{p.project_name}</div>
                                                            <div style={{ fontSize: "12px", color: "#64748b" }}>{p.project_code || '—'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "12px" }}><span style={{ padding: "4px 10px", background: "#f1f5f9", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>{getDeptName(p.department_id)}</span></td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ 
                                                        background: p.status === 'Completed' ? '#dcfce7' : p.status === 'Overdue' ? '#fee2e2' : '#dbeafe', 
                                                        color: p.status === 'Completed' ? '#14532d' : p.status === 'Overdue' ? '#7f1d1d' : '#1e40af',
                                                        padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" 
                                                    }}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                                                    {new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <div style={{ flex: 1, minWidth: "80px", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                                                            <div style={{ width: `${p.completion_percentage || 0}%`, height: "100%", background: p.completion_percentage === 100 ? "#22c55e" : "var(--primary, #4f46e5)" }}></div>
                                                        </div>
                                                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155", width: "36px" }}>{p.completion_percentage || 0}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === "calendar" && renderCalendarGrid()}
                {viewMode === "reports" && renderReportsSuite()}
            </div>
        </DashboardLayout>
    );
}

export default ProjectDashboard;
