
import SettingsCard from "./SettingsCard";
import SettingRow from "./SettingRow";
import SettingSwitch from "./SettingSwitch";

const NotificationSettings = ({ data, onChange }) => {
    
    const handleToggle = (key) => {
        onChange(key, !data[key]);
    };

    return (
        <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "20px", textAlign: "left" }}>
                Notification Preferences
            </h2>
            
            <SettingsCard title="Attendance" description="Notifications regarding your daily attendance.">
                <SettingRow label="Attendance Reminder" description="Remind me to clock in/out.">
                    <SettingSwitch checked={data.attendanceReminder} onChange={() => handleToggle("attendanceReminder")} />
                </SettingRow>
                <SettingRow label="Late Alert" description="Notify me if I am marked late.">
                    <SettingSwitch checked={data.lateAlert} onChange={() => handleToggle("lateAlert")} />
                </SettingRow>
            </SettingsCard>

            <SettingsCard title="Leave" description="Updates on your leave requests.">
                <SettingRow label="Leave Approved" description="Notify when a manager approves leave.">
                    <SettingSwitch checked={data.leaveApproved} onChange={() => handleToggle("leaveApproved")} />
                </SettingRow>
                <SettingRow label="Leave Rejected" description="Notify when a leave request is rejected.">
                    <SettingSwitch checked={data.leaveRejected} onChange={() => handleToggle("leaveRejected")} />
                </SettingRow>
            </SettingsCard>

            <SettingsCard title="Tasks" description="Notifications for assigned tasks.">
                <SettingRow label="New Task" description="When a new task is assigned to me.">
                    <SettingSwitch checked={data.newTask} onChange={() => handleToggle("newTask")} />
                </SettingRow>
                <SettingRow label="Task Due" description="Reminders for upcoming task deadlines.">
                    <SettingSwitch checked={data.taskDue} onChange={() => handleToggle("taskDue")} />
                </SettingRow>
                <SettingRow label="Task Completed" description="When a task status is changed to completed.">
                    <SettingSwitch checked={data.taskCompleted} onChange={() => handleToggle("taskCompleted")} />
                </SettingRow>
            </SettingsCard>

            <SettingsCard title="System & Delivery" description="Platform updates and how you receive notifications.">
                <SettingRow label="System Maintenance & Updates">
                    <SettingSwitch checked={data.systemUpdates} onChange={() => handleToggle("systemUpdates")} />
                </SettingRow>
                <SettingRow label="Delivery Method">
                    <select 
                        value={data.deliveryMethod || "in-app"} 
                        onChange={(e) => onChange("deliveryMethod", e.target.value)}
                        style={inputStyle}
                    >
                        <option value="in-app">In-App Only</option>
                        <option value="email">Email + In-App</option>
                        <option value="desktop">Desktop Notifications</option>
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
    outline: "none",
    backgroundColor: "#f8fafc",
    cursor: "pointer"
};

export default NotificationSettings;
