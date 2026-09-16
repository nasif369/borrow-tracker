const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema({
    borrower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    description: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["unpaid", "payment_requested", "paid"],
        default: "unpaid"
    },

    paymentRequestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    paymentRequestedAt: {
        type: Date,
        default: null
    },

    paidAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Debt", debtSchema);