const db = require("../config/db");

// 1. GET /api/office-settings
const getOfficeSettings = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM office_settings WHERE id = 1");
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Office settings not found."
            });
        }
        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Get office settings error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load office settings."
        });
    }
};

// 2. POST /api/office-settings
const updateOfficeSettings = async (req, res) => {
    try {
        const { office_name, latitude, longitude, attendance_radius } = req.body;

        if (!office_name || latitude === undefined || longitude === undefined || attendance_radius === undefined) {
            return res.status(400).json({
                success: false,
                message: "All fields (office_name, latitude, longitude, attendance_radius) are required."
            });
        }

        // Validate values
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const rad = parseFloat(attendance_radius);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            return res.status(400).json({ success: false, message: "Latitude must be between -90 and 90." });
        }
        if (isNaN(lon) || lon < -180 || lon > 180) {
            return res.status(400).json({ success: false, message: "Longitude must be between -180 and 180." });
        }
        if (isNaN(rad) || rad <= 0) {
            return res.status(400).json({ success: false, message: "Radius must be a positive number." });
        }

        await db.promise().query(
            `INSERT INTO office_settings (id, office_name, latitude, longitude, attendance_radius)
             VALUES (1, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                office_name = VALUES(office_name),
                latitude = VALUES(latitude),
                longitude = VALUES(longitude),
                attendance_radius = VALUES(attendance_radius)`,
            [office_name, lat, lon, rad]
        );

        return res.status(200).json({
            success: true,
            message: "Office settings updated successfully."
        });
    } catch (error) {
        console.error("Update office settings error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update office settings."
        });
    }
};

module.exports = {
    getOfficeSettings,
    updateOfficeSettings
};
