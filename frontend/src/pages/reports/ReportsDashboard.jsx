import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardLayout from "../layouts/DashboardLayout";
import ReportFilters from "./components/ReportFilters";
import ReportTable from "./components/ReportTable";
import ExportButtons from "./components/ExportButtons";
import ReportSummaryCards from "./components/ReportSummaryCards";
import PrintReport from "./components/PrintReport";


const API = "http://localhost:5000/api";

function ReportsDashboard() {
    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const role = user.role || "Employee";

    const getTabsForRole = () => {
        if (role === "Admin") {
            return [
                { id: "employees", name: "Employee Report", icon: "badge" },
                { id: "attendance", name: "Attendance Report", icon: "calendar_month" },
                { id: "leaves", name: "Leave Report", icon: "time_to_leave" },
                { id: "tasks", name: "Task Report", icon: "checklist" },
                { id: "departments", name: "Department Report", icon: "domain" }
            ];
        } else if (role === "Manager") {
            return [
                { id: "attendance", name: "Attendance Report", icon: "calendar_month" },
                { id: "leaves", name: "Leave Report", icon: "time_to_leave" },
                { id: "tasks", name: "Task Report", icon: "checklist" },
                { id: "departments", name: "Department Summary", icon: "domain" }
            ];
        } else {
            return [
                { id: "attendance", name: "My Attendance", icon: "calendar_month" },
                { id: "leaves", name: "My Leaves", icon: "time_to_leave" },
                { id: "tasks", name: "My Tasks", icon: "checklist" }
            ];
        }
    };

    const tabs = getTabsForRole();
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || "attendance");
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: "", department: "", employee: "", status: "", priority: "",
        month: "", year: "", from: "", to: "", sort: "DESC"
    });

    useEffect(() => {
        setFilters({
            search: "", department: "", employee: "", status: "", priority: "",
            month: "", year: "", from: "", to: "", sort: "DESC"
        });
        setData([]);
        setStats(null);
    }, [activeTab]);

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== "") queryParams.append(k, v);
            });

            const url = `${API}/reports/${activeTab}?${queryParams.toString()}`;
            const response = await axios.get(url, { headers });
            if (response.data && response.data.success) {
                setData(response.data.data || []);
                setStats(response.data.stats || null);
            }
        } catch (error) {
            console.error("Error loading report data:", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters]);

    useEffect(() => { fetchReportData(); }, [fetchReportData]);

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleReset = () => {
        setFilters({
            search: "", department: "", employee: "", status: "", priority: "",
            month: "", year: "", from: "", to: "", sort: "DESC"
        });
    };

    const getColumnsConfig = () => {
        switch (activeTab) {
            case "employees":
                return {
                    columns: ["Employee ID", "Name", "Department", "Designation", "Email", "Mobile", "Joining Date", "Status"],
                    keys: ["employee_id", "name", "department", "designation", "email", "mobile", "joining_date", "status"]
                };
            case "attendance":
                return {
                    columns: ["Employee ID", "Name", "Date", "Check In", "Check Out", "Working Hours", "Status"],
                    keys: ["employee_id", "employee_name", "date", "check_in", "check_out", "working_hours", "attendance_status"]
                };
            case "leaves":
                return {
                    columns: ["Employee ID", "Name", "Leave Type", "Start Date", "End Date", "Total Days", "Status"],
                    keys: ["employee_id", "employee", "leave_type", "start_date", "end_date", "total_days", "status"]
                };
            case "tasks":
                return {
                    columns: ["Task ID", "Title", "Assigned To", "Department", "Priority", "Status", "Due Date"],
                    keys: ["task_id", "task_title", "assigned_employee", "department", "priority", "status", "due_date"]
                };
            default:
                return {
                    columns: ["Department Name", "Manager", "Team Size", "Active Tasks", "Attendance Rate"],
                    keys: ["department", "department_head", "employees", "active_tasks", "attendance_percentage"]
                };
        }
    };

    const config = getColumnsConfig();
    const handlePrint = () => window.print();

    // Stats panel helper (renders inside the results box below header)
    const renderStatsPanel = () => {
        if (!stats) return null;

        let items = [];
        if (activeTab === "employees") {
            items = [
                { label: "Total Employees", value: stats.totalEmployees, borderClass: "blue", textClass: "" },
                { label: "Active", value: stats.activeEmployees, borderClass: "green", textClass: "green-text" },
                { label: "Inactive", value: stats.inactiveEmployees, borderClass: "red", textClass: "red-text" }
            ];
        } else if (activeTab === "attendance") {
            items = [
                { label: "Present Days", value: stats.presentDays || 0, borderClass: "green", textClass: "green-text" },
                { label: "Absent Days", value: stats.absentDays || 0, borderClass: "red", textClass: "red-text" },
                { label: "Attendance Rate", value: `${stats.attendancePercentage || 0}%`, borderClass: "blue", textClass: "" }
            ];
        } else if (activeTab === "leaves") {
            items = [
                { label: "Total Requests", value: stats.totalRequests || 0, borderClass: "blue", textClass: "" },
                { label: "Approved Requests", value: stats.approved || 0, borderClass: "green", textClass: "green-text" },
                { label: "Pending Requests", value: stats.pending || 0, borderClass: "orange", textClass: "orange-text" }
            ];
        } else if (activeTab === "tasks") {
            items = [
                { label: "Total Tasks", value: stats.totalTasks || 0, borderClass: "blue", textClass: "" },
                { label: "Completed Tasks", value: stats.completed || 0, borderClass: "green", textClass: "green-text" },
                { label: "Overdue Tasks", value: stats.overdue || 0, borderClass: "red", textClass: "red-text" }
            ];
        } else if (activeTab === "departments") {
            items = [
                { label: "Total Employees", value: stats.employeeCount || 0, borderClass: "blue", textClass: "" },
                { label: "Avg Attendance", value: `${stats.attendancePercentage || 0}%`, borderClass: "green", textClass: "green-text" },
                { label: "Avg Leave Rate", value: `${stats.leavePercentage || 0}%`, borderClass: "orange", textClass: "orange-text" }
            ];
        }

        return (
            <div className="results-mini-stats-grid">
                {items.map((item, i) => (
                    <div key={`key-${i}` /* fixed by script */} className={`results-mini-card ${item.borderClass}`}>
                        <div className="mini-card-label">{item.label}</div>
                        <div className={`mini-card-value ${item.textClass}`}>{item.value}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="reports-container">
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "between", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#191b23", margin: 0 }}>Reports Center</h1>
                        <span className="reports-header-count">
                            {loading ? "Loading..." : `${data.length} records found`}
                        </span>
                    </div>
                </div>

                {/* Summary Cards */}
                <ReportSummaryCards />

                {/* Tab Navigation */}
                <div className="reports-tabs-bar">
                    {tabs.map((tab) => (
                        <button type="button"
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`reports-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <ReportFilters
                    reportType={activeTab}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleReset}
                />

                {/* Data Table Area */}
                <div className="reports-results-box">
                    {/* Header actions */}
                    <div className="results-action-bar">
                        <h3>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: "22px" }}>analytics</span>
                            {tabs.find(t => t.id === activeTab)?.name || "Report"} Results
                        </h3>
                        <ExportButtons
                            reportType={activeTab}
                            filters={filters}
                            onPrint={handlePrint}
                        />
                    </div>

                    {/* Table Mini stats cards */}
                    {renderStatsPanel()}

                    {/* Data Table */}
                    <ReportTable
                        columns={config.columns}
                        keys={config.keys}
                        data={data}
                    />
                </div>

                {/* Hidden Print Layout */}
                <PrintReport
                    reportTitle={tabs.find(t => t.id === activeTab)?.name || "Staffspire Report"}
                    columns={config.columns}
                    keys={config.keys}
                    data={data}
                />
            </div>
        </DashboardLayout>
    );
}

export default ReportsDashboard;

