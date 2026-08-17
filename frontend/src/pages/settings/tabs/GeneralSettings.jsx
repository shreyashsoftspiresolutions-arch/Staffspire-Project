
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";

const GeneralSettings = ({ data, onChange }) => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                General Settings
            </h2>
            <SettingsCard title="Personal Preferences" description="Manage your basic application preferences.">
                
                <SettingRow label="Language" description="Select the language for the interface.">
                    <select 
                        value={data.language || "en"} 
                        onChange={(e) => onChange("language", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                    </select>
                </SettingRow>

                <SettingRow label="Time Zone" description="Set your local time zone.">
                    <select 
                        value={data.timezone || "Asia/Kolkata"} 
                        onChange={(e) => onChange("timezone", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="UTC">UTC</option>
                    </select>
                </SettingRow>

                <SettingRow label="Date Format" description="How dates should be displayed.">
                    <select 
                        value={data.dateFormat || "DD/MM/YYYY"} 
                        onChange={(e) => onChange("dateFormat", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                </SettingRow>

                <SettingRow label="Time Format" description="12-hour or 24-hour clock.">
                    <select 
                        value={data.timeFormat || "24h"} 
                        onChange={(e) => onChange("timeFormat", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="12h">12 Hour</option>
                        <option value="24h">24 Hour</option>
                    </select>
                </SettingRow>

                <SettingRow label="First Day of Week" description="The day your calendar week begins.">
                    <select 
                        value={data.firstDayOfWeek || "Monday"} 
                        onChange={(e) => onChange("firstDayOfWeek", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="Sunday">Sunday</option>
                        <option value="Monday">Monday</option>
                    </select>
                </SettingRow>

                <SettingRow label="Currency" description="Preferred currency for financial data.">
                    <select 
                        value={data.currency || "USD"} 
                        onChange={(e) => onChange("currency", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </SettingRow>

                <SettingRow label="Number Format" description="How numbers are separated.">
                    <select 
                        value={data.numberFormat || "comma"} 
                        onChange={(e) => onChange("numberFormat", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="comma">1,000,000.00</option>
                        <option value="dot">1.000.000,00</option>
                    </select>
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
    backgroundColor: "#f8fafc",
    outline: "none",
    cursor: "pointer"
};

export default GeneralSettings;
