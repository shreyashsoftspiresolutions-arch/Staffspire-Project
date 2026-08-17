
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";
import SettingSwitch from "./SettingSwitch";

const AttendanceSettings = ({ data, onChange }) => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Attendance Settings
            </h2>
            <SettingsCard title="Working Hours" description="Define standard office hours and policies.">
                
                <SettingRow label="Office Start Time">
                    <input 
                        type="time" 
                        value={data.officeStart || "09:00"} 
                        onChange={(e) => onChange("officeStart", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Office End Time">
                    <input 
                        type="time" 
                        value={data.officeEnd || "17:00"} 
                        onChange={(e) => onChange("officeEnd", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Mark Late After">
                    <input 
                        type="time" 
                        value={data.lateAfter || "09:15"} 
                        onChange={(e) => onChange("lateAfter", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Mark Half Day After">
                    <input 
                        type="time" 
                        value={data.halfDayAfter || "11:00"} 
                        onChange={(e) => onChange("halfDayAfter", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="Allow Overtime" description="Enable overtime calculation.">
                    <SettingSwitch checked={data.overtime} onChange={(v) => onChange("overtime", v)} />
                </SettingRow>

                <SettingRow label="Weekend Days">
                    <select 
                        value={data.weekendDays || "Saturday, Sunday"} 
                        onChange={(e) => onChange("weekendDays", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="Saturday, Sunday">Saturday & Sunday</option>
                        <option value="Sunday">Sunday Only</option>
                        <option value="Friday, Saturday">Friday & Saturday</option>
                    </select>
                </SettingRow>

            </SettingsCard>

            <SettingsCard title="Geofencing & Tracking" description="Manage location-based attendance limits.">
                <SettingRow label="Geofencing Office Name">
                    <input 
                        aria-label="Geofencing Office Name"
                        type="text" 
                        value={data.officeName || ""} 
                        onChange={(e) => onChange("officeName", e.target.value)}
                        style={inputStyle}
                        placeholder="Head Office"
                    />
                </SettingRow>
                <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                        <SettingRow label="Latitude">
                            <input 
                                aria-label="Latitude"
                                type="number" step="any"
                                value={data.latitude || ""} 
                                onChange={(e) => onChange("latitude", e.target.value)}
                                style={inputStyle}
                            />
                        </SettingRow>
                    </div>
                    <div style={{ flex: 1 }}>
                        <SettingRow label="Longitude">
                            <input 
                                aria-label="Longitude"
                                type="number" step="any"
                                value={data.longitude || ""} 
                                onChange={(e) => onChange("longitude", e.target.value)}
                                style={inputStyle}
                            />
                        </SettingRow>
                    </div>
                </div>
                <SettingRow label="GPS Radius (meters)" description="Allowed radius for check-in.">
                    <input 
                        aria-label="GPS Radius"
                        type="number" 
                        value={data.attendance_radius || ""} 
                        onChange={(e) => onChange("attendance_radius", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>
                <SettingRow label="Location Verification" description="Force location checking before clock-in.">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: "0.75rem", background: "#cbd5e1", padding: "2px 6px", borderRadius: "4px" }}>Future</span>
                        <SettingSwitch checked={false} onChange={() => {}} />
                    </div>
                </SettingRow>
                <SettingRow label="Auto Checkout" description="Automatically checkout at end time.">
                    <SettingSwitch checked={data.autoCheckout} onChange={(v) => onChange("autoCheckout", v)} />
                </SettingRow>
            </SettingsCard>
        </div>
    );
};

const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    color: "#334155",
    outline: "none"
};

export default AttendanceSettings;
