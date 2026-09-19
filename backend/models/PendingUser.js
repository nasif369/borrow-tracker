const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    verificationCode: {
        type: String,
        required: true
    },

    verificationCodeExpires: {
        type: Date,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400
    }
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);