import React from "react";

function PrintReport({ reportTitle, columns, keys, data = [] }) {
    return (
        <div className="print-area" style={{ display: "none" }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .print-area, .print-area * {
                        visibility: visible !important;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: block !important;
                        color: #000 !important;
                        background: #fff !important;
                        font-family: Arial, sans-serif;
                    }
                    .print-header {
                        border-bottom: 2px solid #000;
                        padding-bottom: 12px;
                        margin-bottom: 20px;
                    }
                    .print-title {
                        font-size: 20px;
                        font-weight: bold;
                        margin: 0;
                    }
                    .print-meta {
                        font-size: 12px;
                        color: #555;
                        margin-top: 5px;
                    }
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #ccc;
                        padding: 8px 10px;
                        font-size: 12px;
                        text-align: left;
                    }
                    .print-table th {
                        background-color: #f3f4f6 !important;
                        font-weight: bold;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        border-top: 1px solid #ddd;
                        padding-top: 5px;
                        font-size: 10px;
                        color: #777;
                        text-align: center;
                    }
                }
            ` }} />

            <div className="print-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>Softspire</h1>
                        <span style={{ fontSize: "12px", color: "#555" }}>Employee Management System</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div className="print-title">{reportTitle}</div>
                        <div className="print-meta">Generated Date: {new Date().toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <table className="print-table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={`key-${index}` /* fixed */}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {keys.map((key, colIndex) => (
                                <td key={colIndex}>
                                    {row[key] !== undefined && row[key] !== null ? String(row[key]) : "—"}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: "center", padding: "30px" }}>
                                No data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="print-footer">
                Softspire Systems © {new Date().getFullYear()} — Confidential Report
            </div>
        </div>
    );
}

export default PrintReport;
