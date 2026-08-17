/**
 * Generates a CSV string from rows of data
 * @param {Array<string>} headers - Table header titles
 * @param {Array<string>} keys - Keys in data objects matching headers
 * @param {Array<Object>} rows - Data rows
 * @returns {string}
 */
const generateCSV = (headers, keys, rows) => {
    const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",");
    const bodyRows = rows.map(row => {
        return keys.map(k => {
            const val = row[k] !== undefined && row[k] !== null ? String(row[k]) : "";
            return `"${val.replace(/"/g, '""')}"`;
        }).join(",");
    });
    return [headerRow, ...bodyRows].join("\r\n");
};

module.exports = { generateCSV };
