import React, { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaSortAmountDownAlt } from "react-icons/fa";

const getStatusBadgeClass = (val) => {
    const v = String(val).toLowerCase();
    if (v === "active" || v === "present" || v === "approved" || v === "completed") return "active";
    if (v === "inactive" || v === "absent" || v === "rejected" || v === "overdue") return "inactive";
    if (v === "late" || v === "pending" || v === "on hold" || v === "half day") return "pending";
    if (v === "in progress") return "in-progress";
    return "";
};

function ReportTable({ columns, keys, data = [] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("asc");
    const rowsPerPage = 10;

    // Sort logic
    let sortedData = [...data];
    if (sortKey) {
        sortedData.sort((a, b) => {
            const aVal = a[sortKey] ?? "";
            const bVal = b[sortKey] ?? "";
            if (sortDir === "asc") return String(aVal).localeCompare(String(bVal));
            return String(bVal).localeCompare(String(aVal));
        });
    }

    const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setCurrentPage(1);
    };

    const formatCellValue = (key, val) => {
        if (val === undefined || val === null || val === "") return <span style={{ color: "#cbd5e1" }}>—</span>;

        // Badges for status/priority
        if (key === "status" || key === "attendance_status" || key === "priority") {
            const cleanedVal = String(val).trim();
            const badgeClass = getStatusBadgeClass(cleanedVal);
            if (badgeClass) {
                return (
                    <span className={`status-pill-badge ${badgeClass}`}>
                        <span className="dot"></span>
                        {cleanedVal}
                    </span>
                );
            }
        }

        // Format dates
        if (key.includes("date") || key === "joining_date" || key === "start_date" || key === "end_date" || key === "due_date") {
            try {
                const dateObj = new Date(val);
                if (!isNaN(dateObj.getTime())) {
                    return dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                }
            } catch (e) {}
        }

        return String(val);
    };

    return (
        <div className="reports-results-box" style={{ marginTop: "0" }}>
            <div className="table-scrollable">
                <table className="reports-data-table">
                    <thead>
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={`key-${index}` /* fixed */}
                                    onClick={() => handleSort(keys[index])}
                                    style={{ cursor: "pointer" }}
                                >
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                        {col}
                                        {sortKey === keys[index] && (
                                            <FaSortAmountDownAlt size={10} style={{ transform: sortDir === "desc" ? "scaleY(-1)" : "none", color: "#2563eb" }} />
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {keys.map((key, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`${colIndex === 0 ? "font-medium" : ""} ${colIndex > 2 ? "text-secondary" : ""}`}
                                    >
                                        {formatCellValue(key, row[key])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} style={{ textAlign: "center", color: "#94a3b8", padding: "50px", fontSize: "15px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "36px" }}>inbox</span>
                                        No records found for the selected criteria.
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {data.length > 0 && (
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderTop: "1px solid rgba(195, 198, 215, 0.3)",
                    background: "#faf8ff"
                }}>
                    <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: "500" }}>
                        Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + rowsPerPage, data.length)}</strong> of <strong>{data.length}</strong> records
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button type="button"
                            aria-label="Previous Page"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{
                                background: currentPage === 1 ? "#faf8ff" : "white",
                                border: "1px solid #c3c6d7",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                color: currentPage === 1 ? "#cbd5e1" : "#585f6c",
                                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                transition: "all 0.15s",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <FaChevronLeft size={11} />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <button type="button"
                                    key={pageNum}
                                    aria-label={`Page ${pageNum}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                    style={{
                                        background: currentPage === pageNum ? "#2563eb" : "white",
                                        border: `1px solid ${currentPage === pageNum ? "#2563eb" : "#c3c6d7"}`,
                                        borderRadius: "8px",
                                        padding: "8px 13px",
                                        color: currentPage === pageNum ? "white" : "#585f6c",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        fontSize: "13px",
                                        transition: "all 0.15s"
                                    }}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button type="button"
                            aria-label="Next Page"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                background: currentPage === totalPages ? "#faf8ff" : "white",
                                border: "1px solid #c3c6d7",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                color: currentPage === totalPages ? "#cbd5e1" : "#585f6c",
                                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                transition: "all 0.15s",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <FaChevronRight size={11} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportTable;
