const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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

    emailVerified: {
        type: Boolean,
        default: false
    },

    verificationCode: {
        type: String,
        default: null
    },

   verificationCodeExpires: {
    type: Date,
    default: null
},

resetPasswordCode: {
    type: String,
    default: null
},

resetPasswordCodeExpires: {
    type: Date,
    default: null
}
,
resetPasswordVerified: {
    type: Boolean,
    default: false
},
});

module.exports = mongoose.model("User", userSchema);