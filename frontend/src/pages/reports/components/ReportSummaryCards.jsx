import React, { useEffect, useState } from "react";
import axios from "axios";
import useSWR from "swr";
import { FaUsers, FaCalendarCheck, FaClipboardList, FaTasks, FaBuilding } from "react-icons/fa";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

function ReportSummaryCards() {
    const [stats, setStats] = useState(null);
    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const role = user.role || "Employee";


    const { data } = useSWR("http://localhost:5000/api/reports/dashboard-stats", fetcher);

    useEffect(() => {
        if (data && data.success) {
            setStats(data.stats);
        }
    }, [data]);

    if (!stats) {
        return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px", marginBottom: "28px" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={`key-${i}` /* fixed by script */} style={{
                        height: "100px", background: "white", borderRadius: "14px",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                        animation: "shimmer 1.5s infinite linear",
                        backgroundImage: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                        backgroundSize: "200% 100%"
                    }} />
                ))}
            </div>
        );
    }

    const cards = [
        { title: role === "Employee" ? "Profile Active" : "Total Employees", value: stats.totalEmployees, icon: <FaUsers />, color: "#4f8cff", bg: "#eff6ff" },
        { title: "Present Today", value: stats.presentToday, icon: <FaCalendarCheck />, color: "#22c55e", bg: "#dcfce7" },
        { title: "Pending Leaves", value: stats.pendingLeaves, icon: <FaClipboardList />, color: "#f59e0b", bg: "#fef9c3" },
        { title: "Active Tasks", value: stats.activeTasks, icon: <FaTasks />, color: "#8b5cf6", bg: "#f3e8ff" }
    ];

    if (role === "Admin") {
        cards.push({ title: "Departments", value: stats.departments, icon: <FaBuilding />, color: "#ec4899", bg: "#fce7f3" });
    }

    const getBorderClass = (title) => {
        if (title.includes("Employees") || title.includes("Active")) return "blue";
        if (title.includes("Present")) return "green";
        if (title.includes("Pending")) return "orange";
        if (title.includes("Active Tasks")) return "purple";
        return "rose";
    };

    const getIconClass = (title) => {
        if (title.includes("Employees") || title.includes("Active")) return "blue";
        if (title.includes("Present")) return "green";
        if (title.includes("Pending")) return "orange";
        if (title.includes("Active Tasks")) return "purple";
        return "rose";
    };

    return (
        <div className="reports-kpi-grid">
            {cards.map((card, index) => {
                const borderClass = getBorderClass(card.title);
                const iconClass = getIconClass(card.title);
                
                // Convert icons to use material symbols
                const getMaterialIcon = (title) => {
                    if (title.includes("Employees") || title.includes("Active")) return "groups";
                    if (title.includes("Present")) return "how_to_reg";
                    if (title.includes("Pending")) return "pending_actions";
                    if (title.includes("Active Tasks")) return "task";
                    return "corporate_fare";
                };

                return (
                    <div key={`key-${index}` /* fixed */} className={`reports-kpi-card ${borderClass}`}>
                        <div className="kpi-header-row">
                            <span className="kpi-title">{card.title}</span>
                            <div className={`kpi-icon-box ${iconClass}`}>
                                <span className="material-symbols-outlined">{getMaterialIcon(card.title)}</span>
                            </div>
                        </div>
                        <div className="kpi-value">{card.value}</div>
                    </div>
                );
            })}
        </div>
    );
}

export default ReportSummaryCards;
