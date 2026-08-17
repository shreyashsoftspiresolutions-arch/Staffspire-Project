import React, { useState } from "react";
import axios from "axios";

function ExportButtons({ reportType, filters, onPrint }) {
    const [loadingType, setLoadingType] = useState(null);
    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const role = user.role || "Employee";

    const handleExport = async (format) => {
        try {
            setLoadingType(format);
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams({ type: reportType, ...filters }).toString();
            const url = `http://localhost:5000/api/reports/export/${format}?${queryParams}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob"
            });

            const blob = new Blob([response.data]);
            const link = document.createElement("a");
            const objUrl = window.URL.createObjectURL(blob);
            link.href = objUrl;
            let ext = format === "excel" ? "xlsx" : format;
            link.setAttribute("download", `${reportType}_report_${new Date().toLocaleDateString('sv')}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objUrl);
        } catch (error) {
            console.error(`Export ${format} failed:`, error);
            alert(`Failed to export as ${format.toUpperCase()}.`);
        } finally {
            setLoadingType(null);
        }
    };

    if (role === "Employee") {
        return (
            <div className="export-buttons-group">
                <button type="button" onClick={onPrint} className="btn-export-action">
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>print</span> Print Report
                </button>
            </div>
        );
    }

    const exportBtns = [
        { format: "pdf", label: "PDF", icon: "picture_as_pdf" },
        { format: "excel", label: "Excel", icon: "table_view" },
        { format: "csv", label: "CSV", icon: "csv" }
    ];

    return (
        <div className="export-buttons-group">
            {exportBtns.map(({ format, label, icon }) => (
                <button type="button"
                    key={format}
                    disabled={loadingType !== null}
                    onClick={() => handleExport(format)}
                    className="btn-export-action"
                >
                    {loadingType === format ? (
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>sync</span>
                    ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{icon}</span>
                    )}
                    {label}
                </button>
            ))}
            <button type="button" onClick={onPrint} className="btn-export-action">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>print</span> Print
            </button>
        </div>
    );
}

export default ExportButtons;
