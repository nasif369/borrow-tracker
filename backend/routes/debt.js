const express = require("express");
const Debt = require("../models/Debt");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ==================== CREATE DEBT ====================

router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            debtType,
            personRollNumber,
            amount,
            description
        } = req.body;

        if (!debtType || !personRollNumber || !amount) {
            return res.status(400).json({
                message: "Please provide all required fields"
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        const currentUser = await User.findById(req.userId);

        if (!currentUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const otherUser = await User.findOne({
            rollNumber: personRollNumber
        });

        if (!otherUser) {
            return res.status(404).json({
                message: "User with this roll number not found"
            });
        }

        if (currentUser._id.equals(otherUser._id)) {
            return res.status(400).json({
                message: "You cannot create a debt with yourself"
            });
        }

        // I BORROWED
        if (debtType === "borrowed") {
            const debt = await Debt.create({
                borrower: currentUser._id,
                lender: otherUser._id,
                amount: Number(amount),
                description: description || ""
            });

            return res.status(201).json({
                message: "Debt created successfully",
                debt
            });
        }

        // I LENT
        if (debtType === "lent") {
            const debt = await Debt.create({
                borrower: otherUser._id,
                lender: currentUser._id,
                amount: Number(amount),
                description: description || ""
            });

            return res.status(201).json({
                message: "Debt created successfully",
                debt
            });
        }

        return res.status(400).json({
            message: "Invalid debt type"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create debt",
            error: error.message
        });
    }
});


// ==================== GET MY DEBTS ====================

router.get("/", authMiddleware, async (req, res) => {
    try {

        const debts = await Debt.find({
            $or: [
                { borrower: req.userId },
                { lender: req.userId }
            ]
        })
        .populate("borrower", "rollNumber name")
        .populate("lender", "rollNumber name")
        .sort({ createdAt: -1 });

        res.json({
            debts: debts
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch debts",
            error: error.message
        });
    }
});


// ==================== EDIT DEBT ====================

router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const {
            debtType,
            personRollNumber,
            amount,
            description
        } = req.body;

        const debt = await Debt.findById(req.params.id);

        if (!debt) {
            return res.status(404).json({
                message: "Debt not found"
            });
        }

        // Only borrower or lender can edit
        const isBorrower = debt.borrower.equals(req.userId);
        const isLender = debt.lender.equals(req.userId);

        if (!isBorrower && !isLender) {
            return res.status(403).json({
                message: "You are not allowed to edit this debt"
            });
        }

        // Paid debts cannot be edited
        if (debt.status === "paid") {
            return res.status(400).json({
                message: "Paid debts cannot be edited"
            });
        }

        if (!debtType || !personRollNumber || !amount) {
            return res.status(400).json({
                message: "Please provide all required fields"
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        const currentUser = await User.findById(req.userId);

        if (!currentUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const otherUser = await User.findOne({
            rollNumber: personRollNumber
        });

        if (!otherUser) {
            return res.status(404).json({
                message: "User with this roll number not found"
            });
        }

        if (currentUser._id.equals(otherUser._id)) {
            return res.status(400).json({
                message: "You cannot create a debt with yourself"
            });
        }

        // I BORROWED
        if (debtType === "borrowed") {
            debt.borrower = currentUser._id;
            debt.lender = otherUser._id;
        }

        // I LENT
        else if (debtType === "lent") {
            debt.borrower = otherUser._id;
            debt.lender = currentUser._id;
        }

        else {
            return res.status(400).json({
                message: "Invalid debt type"
            });
        }

        debt.amount = Number(amount);
        debt.description = description || "";

        // Editing resets payment request
        debt.status = "unpaid";
        debt.paymentRequestedBy = null;
        debt.paymentRequestedAt = null;

        await debt.save();

        res.json({
            message: "Debt updated successfully",
            debt
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to edit debt",
            error: error.message
        });
    }
});


// ==================== REQUEST PAYMENT ====================

router.patch("/:id/request-payment", authMiddleware, async (req, res) => {
    try {

        const debt = await Debt.findById(req.params.id);

        if (!debt) {
            return res.status(404).json({
                message: "Debt not found"
            });
        }

        // Only the borrower can say "I Paid"
        if (!debt.borrower.equals(req.userId)) {
            return res.status(403).json({
                message: "Only the borrower can request payment confirmation"
            });
        }

        if (debt.status === "paid") {
            return res.status(400).json({
                message: "This debt is already paid"
            });
        }

        if (debt.status === "payment_requested") {
            return res.status(400).json({
                message: "Payment confirmation is already requested"
            });
        }

        debt.status = "payment_requested";
        debt.paymentRequestedBy = req.userId;
        debt.paymentRequestedAt = new Date();

        await debt.save();

        res.json({
            message: "Payment confirmation requested",
            debt
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to request payment confirmation",
            error: error.message
        });
    }
});


// ==================== CONFIRM PAYMENT ====================

router.patch("/:id/confirm-payment", authMiddleware, async (req, res) => {
    try {

        const debt = await Debt.findById(req.params.id);

        if (!debt) {
            return res.status(404).json({
                message: "Debt not found"
            });
        }

        // Only the lender can confirm payment
        if (!debt.lender.equals(req.userId)) {
            return res.status(403).json({
                message: "Only the lender can confirm the payment"
            });
        }

        if (debt.status !== "payment_requested") {
            return res.status(400).json({
                message: "There is no payment confirmation request"
            });
        }

        debt.status = "paid";
        debt.paidAt = new Date();

        await debt.save();

        res.json({
            message: "Payment confirmed successfully",
            debt
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to confirm payment",
            error: error.message
        });
    }
});


// ==================== DELETE DEBT ====================

router.delete("/:id", authMiddleware, async (req, res) => {
    try {

        const debt = await Debt.findById(req.params.id);

        if (!debt) {
            return res.status(404).json({
                message: "Debt not found"
            });
        }

        // Paid debts cannot be deleted
        if (debt.status === "paid") {
            return res.status(400).json({
                message: "Paid debts cannot be deleted"
            });
        }

        // Only borrower or lender can delete the debt
        const isBorrower = debt.borrower.equals(req.userId);
        const isLender = debt.lender.equals(req.userId);

        if (!isBorrower && !isLender) {
            return res.status(403).json({
                message: "You are not allowed to delete this debt"
            });
        }

        await Debt.findByIdAndDelete(req.params.id);

        res.json({
            message: "Debt deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete debt",
            error: error.message
        });
    }
});


module.exports = router;