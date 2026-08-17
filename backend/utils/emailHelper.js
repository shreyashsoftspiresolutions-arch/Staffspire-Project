const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const sendEmail = async ({ to, subject, html, text }) => {
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;
    const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (hasSmtpConfig || hasGmailConfig) {
        try {
            const host = process.env.SMTP_HOST || "smtp.gmail.com";
            const port = Number(process.env.SMTP_PORT || 465);
            const user = process.env.SMTP_USER || process.env.EMAIL_USER;
            let pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
            if (host === "smtp.gmail.com") {
                pass = pass.replace(/\s+/g, "");
            }

            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: {
                    user,
                    pass,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            await transporter.sendMail({
                from: `"Staffspire Alert" <${user}>`,
                to,
                subject,
                text: text || "Staffspire Notification Update",
                html
            });
            console.log(`[Email] Successfully sent email to ${to}`);
            return true;
        } catch (error) {
            console.error(`[Email] Error sending email via SMTP to ${to}:`, error);
        }
    }

    // Mock Log Fallback
    try {
        const logDir = path.join(__dirname, "../");
        const logPath = path.join(logDir, "mock_emails.log");
        const timestamp = new Date().toISOString();
        const divider = "=".repeat(60);

        const logContent = `
${divider}
TIMESTAMP: ${timestamp}
TO:        ${to}
SUBJECT:   ${subject}
BODY (HTML):
${html}
${divider}
`;
        fs.appendFileSync(logPath, logContent, "utf8");
        console.log(`[Mock Email] SMTP not configured. Appended email log for ${to} to mock_emails.log`);
        return true;
    } catch (fsError) {
        console.error("[Email] Failed to write mock email log:", fsError);
    }
    return false;
};

module.exports = { sendEmail };
