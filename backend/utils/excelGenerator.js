const ExcelJS = require("exceljs");

/**
 * Generates an Excel spreadsheet using ExcelJS and writes to response stream
 * @param {Object} res - Express response object
 * @param {string} reportTitle - Title of the report
 * @param {Array<string>} headers - Column display names
 * @param {Array<string>} keys - Column object keys
 * @param {Array<Object>} rows - Data rows
 * @param {string} filename - Output filename
 */
const generateExcel = async (res, reportTitle, headers, keys, rows, filename = "report.xlsx") => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportTitle.substring(0, 31));

    // Title Row
    worksheet.mergeCells("A1:I1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = reportTitle;
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFF" } };
    titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1E293B" } // Slate-800
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 40;

    // Subtitle / Date Row
    worksheet.mergeCells("A2:I2");
    const subtitleCell = worksheet.getCell("A2");
    subtitleCell.value = `Generated: ${new Date().toLocaleString()}`;
    subtitleCell.font = { name: "Arial", size: 10, italic: true };
    subtitleCell.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(2).height = 20;

    // Empty spacing
    worksheet.getRow(3).height = 10;

    // Header Row
    const headerRowNumber = 4;
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = headers;
    headerRow.height = 26;

    headers.forEach((_, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "3B82F6" } // Blue-500
        };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
    });

    // Data Rows
    rows.forEach((rowData, rowIndex) => {
        const rowNum = rowIndex + 5;
        const row = worksheet.getRow(rowNum);
        row.height = 22;

        keys.forEach((key, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            let val = rowData[key];

            // Format date objects or patterns
            if (val instanceof Date) {
                cell.value = val;
                cell.numFmt = "yyyy-mm-dd hh:mm:ss";
            } else if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                cell.value = new Date(val);
                cell.numFmt = "yyyy-mm-dd";
            } else {
                cell.value = val !== undefined && val !== null ? val : "";
            }

            // Zebra striping
            if (rowIndex % 2 === 1) {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "F8FAFC" } // Slate-50 alternate stripe
                };
            }

            cell.font = { name: "Arial", size: 10 };
            cell.alignment = { vertical: "middle", horizontal: "left" };
            cell.border = {
                top: { style: "thin", color: { argb: "E2E8F0" } },
                left: { style: "thin", color: { argb: "E2E8F0" } },
                bottom: { style: "thin", color: { argb: "E2E8F0" } },
                right: { style: "thin", color: { argb: "E2E8F0" } }
            };
        });
    });

    // Auto Column Widths
    worksheet.columns.forEach((column, i) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
            if (cell.row > 3) { // Skip title/subtitle
                const columnLength = cell.value ? String(cell.value).length : 0;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            }
        });
        column.width = Math.max(maxLength + 4, 12);
    });

    // Response settings
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
};

module.exports = { generateExcel };
