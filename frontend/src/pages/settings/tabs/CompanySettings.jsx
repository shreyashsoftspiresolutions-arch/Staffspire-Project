
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";

const CompanySettings = ({ data, onChange }) => {
    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Company Settings
            </h2>
            <SettingsCard title="Organization Details" description="Basic information about your company.">
                
                <SettingRow label="Company Name">
                    <input 
                        type="text"
                        aria-label="Company Name"
                        value={data.companyName || ""} 
                        onChange={(e) => onChange("companyName", e.target.value)}
                        style={inputStyle}
                        placeholder="StaffSpire Inc."
                    />
                </SettingRow>

                <SettingRow label="Logo URL" description="Link to your company logo.">
                    <input 
                        type="text"
                        aria-label="Logo URL"
                        value={data.logo || ""} 
                        onChange={(e) => onChange("logo", e.target.value)}
                        style={inputStyle}
                        placeholder="https://..."
                    />
                </SettingRow>

                <SettingRow label="Contact Email">
                    <input 
                        type="email"
                        aria-label="Contact Email"
                        value={data.email || ""} 
                        onChange={(e) => onChange("email", e.target.value)}
                        style={inputStyle}
                        placeholder="contact@company.com"
                    />
                </SettingRow>

                <SettingRow label="Phone Number">
                    <input 
                        type="text"
                        aria-label="Phone Number"
                        value={data.phone || ""} 
                        onChange={(e) => onChange("phone", e.target.value)}
                        style={inputStyle}
                        placeholder="+1 234 567 8900"
                    />
                </SettingRow>

                <SettingRow label="Website">
                    <input 
                        type="text"
                        aria-label="Website"
                        value={data.website || ""} 
                        onChange={(e) => onChange("website", e.target.value)}
                        style={inputStyle}
                        placeholder="www.company.com"
                    />
                </SettingRow>

                <SettingRow label="Address">
                    <textarea 
                        aria-label="Address"
                        value={data.address || ""} 
                        onChange={(e) => onChange("address", e.target.value)}
                        style={{...inputStyle, resize: "vertical", minHeight: "60px"}}
                        placeholder="123 Business St..."
                    />
                </SettingRow>

            </SettingsCard>

            <SettingsCard title="Legal & Compliance">
                <SettingRow label="Registration Number">
                    <input 
                        type="text"
                        aria-label="Registration Number"
                        value={data.registrationNumber || ""} 
                        onChange={(e) => onChange("registrationNumber", e.target.value)}
                        style={inputStyle}
                    />
                </SettingRow>

                <SettingRow label="GST Number" description="(Optional)">
                    <input 
                        type="text"
                        aria-label="GST Number"
                        value={data.gstNumber || ""} 
                        onChange={(e) => onChange("gstNumber", e.target.value)}
                        style={inputStyle}
                    />
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

export default CompanySettings;
