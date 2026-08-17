const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const secretKey = crypto.createHash('sha256').update(process.env.JWT_SECRET || "Softspire_secure_key").digest();

const encryptPassword = (text) => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (e) {
        console.error("Encryption error:", e);
        return text;
    }
};

const decryptPassword = (text) => {
    try {
        if (!text) return "N/A";

        // Detect bcrypt hashes — these are legacy accounts whose passwords cannot be decoded
        if (text.startsWith("$2b$") || text.startsWith("$2a$") || text.startsWith("$2y$")) {
            return "Password not available (legacy account — please reset password)";
        }

        // Must contain exactly one colon separator for AES iv:ciphertext format
        if (!text.includes(':')) return "Invalid encrypted format";

        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error("Decryption error:", e);
        return "Could not decode — password may be corrupted";
    }
};

module.exports = {
    encryptPassword,
    decryptPassword
};