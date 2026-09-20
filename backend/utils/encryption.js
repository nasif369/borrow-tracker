const crypto = require("crypto");

const algorithm = "aes-256-gcm";

const encryptionKey = crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET)
    .digest();

function encrypt(text) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
        algorithm,
        encryptionKey,
        iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");

    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex")
    };
}

function decrypt(encrypted, iv, authTag) {
    const decipher = crypto.createDecipheriv(
        algorithm,
        encryptionKey,
        Buffer.from(iv, "hex")
    );

    decipher.setAuthTag(
        Buffer.from(authTag, "hex")
    );

    let decrypted = decipher.update(
        encrypted,
        "hex",
        "utf8"
    );

    decrypted += decipher.final("utf8");

    return decrypted;
}

module.exports = {
    encrypt,
    decrypt
};