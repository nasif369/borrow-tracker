const express = require("express");
const User = require("../models/User");
const Debt = require("../models/Debt");
const authMiddleware = require("../middleware/authMiddleware");
const { decrypt } = require("../utils/encryption");

const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

const ACTIONS = {
    NONE: "none",
    CREATE_DEBT: "create_debt"
};

// Determine the logged-in user's side of a debt
function getDebtDirection(debt, userId) {
    const currentUserId = userId.toString();

    if (debt.borrower._id.toString() === currentUserId) {
        return "you_owe_them";
    }

    if (debt.lender._id.toString() === currentUserId) {
        return "they_owe_you";
    }

    return null;
}

// GEMINI AI CHAT
router.post("/chat", authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Message is required"
            });
        }

        // Find logged-in user
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check whether Gemini is connected
        if (
            !user.geminiConnected ||
            !user.geminiApiKey ||
            !user.geminiApiKey.encrypted
        ) {
            return res.status(400).json({
                message: "Gemini is not connected."
            });
        }

        // Get all debts involving the logged-in user
        const debts = await Debt.find({
            $or: [
                { borrower: req.userId },
                { lender: req.userId }
            ]
        })
            .populate("borrower", "name rollNumber")
            .populate("lender", "name rollNumber");

        // Calculate verified debt summary
        let totalOwedByUser = 0;
        let totalOwedToUser = 0;

        let unpaidOwedByUser = 0;
        let unpaidOwedToUser = 0;

        let paidOwedByUser = 0;
        let paidOwedToUser = 0;

        for (const debt of debts) {

            const isBorrower =
                debt.borrower &&
                debt.borrower._id.toString() === req.userId.toString();

            const isLender =
                debt.lender &&
                debt.lender._id.toString() === req.userId.toString();

            if (isBorrower) {

                totalOwedByUser += debt.amount;

                if (debt.status === "unpaid") {
                    unpaidOwedByUser += debt.amount;
                }

                if (debt.status === "paid") {
                    paidOwedByUser += debt.amount;
                }

            } else if (isLender) {

                totalOwedToUser += debt.amount;

                if (debt.status === "unpaid") {
                    unpaidOwedToUser += debt.amount;
                }

                if (debt.status === "paid") {
                    paidOwedToUser += debt.amount;
                }
            }
        }

        const debtSummary = {
            totalDebts: debts.length,

            totalOwedByUser,
            totalOwedToUser,

            unpaidOwedByUser,
            unpaidOwedToUser,

            paidOwedByUser,
            paidOwedToUser
        };

        // Get registered users for AI person identification
        const availableUsers = await User.find({
            _id: { $ne: req.userId }
        })
            .select("name rollNumber")
            .lean();

        // Prepare debt information for Gemini
        const debtData = debts.map((debt) => ({
            debtId: debt._id.toString(),

            direction: getDebtDirection(debt, req.userId),

            borrower: {
                name: debt.borrower.name,
                rollNumber: debt.borrower.rollNumber
            },

            lender: {
                name: debt.lender.name,
                rollNumber: debt.lender.rollNumber
            },

            amount: debt.amount,
            description: debt.description,
            status: debt.status,
            createdAt: debt.createdAt
        }));

        // Decrypt user's Gemini API key
        const apiKey = decrypt(
            user.geminiApiKey.encrypted,
            user.geminiApiKey.iv,
            user.geminiApiKey.authTag
        );

        // Create Gemini client using this user's key
        const ai = new GoogleGenAI({
            apiKey: apiKey
        });

        const prompt = `
You are the Borrow Tracker AI assistant.

You are helping the currently logged-in user manage and understand their debts.

IMPORTANT RULES:
- The CURRENT LOGGED-IN USER is the person asking the question.
- Use borrower and lender to determine the direction of every debt.
- Do not invent debts, users, amounts, or transactions.
- The VERIFIED DEBT SUMMARY below was calculated by the Borrow Tracker backend. Treat those numbers as authoritative.
- Do not recalculate the verified summary differently.
- You can analyze and explain the user's debts.
- Each debt has a unique debtId. Use debtId to identify the exact debt record.
- Never assume two debts are the same just because they involve the same people or amount.
- When referring to a specific debt, use the debtId together with the people, amount, and description to identify it.
- If the user wants to create a debt, identify the intended action as "create_debt".
- Identify the other person from the AVAILABLE USERS or DEBT RECORDS data.
- If exactly one user matches the person's name, use that user's roll number automatically.
- If multiple users match the name, ask the user to specify the roll number.
- If the person cannot be identified from the available data, ask for the roll number.
- Determine the direction correctly:
  - "you_owe_them" means the logged-in user is the borrower.
  - "they_owe_you" means the other person is the borrower.
- If something is not available in the provided data, clearly say so.
- Keep answers clear and practical.

CURRENT LOGGED-IN USER:
Name: ${user.name}
Roll Number: ${user.rollNumber}

VERIFIED DEBT SUMMARY:
${JSON.stringify(debtSummary, null, 2)}

AVAILABLE USERS:
${JSON.stringify(availableUsers, null, 2)}

DEBT RECORDS:
${JSON.stringify(debtData, null, 2)}

USER'S QUESTION:
${message.trim()}

RESPONSE FORMAT:
Return ONLY valid JSON.

For a normal question:
{
  "action": "none",
  "reply": "your answer"
}

If the user wants to create a debt:
{
  "action": "create_debt",
  "reply": "your response",
  "amount": number,
  "description": "description",
  "personRollNumber": "identified roll number",
  "direction": "you_owe_them"
}

The direction must be either:
"you_owe_them"
or
"they_owe_you"
`;

        const result = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const responseText = result.text;

        let aiResponse;

        try {
            aiResponse = JSON.parse(responseText);
        } catch (error) {
            aiResponse = {
                action: "none",
                reply: responseText
            };
        }

        if (aiResponse.action === "create_debt") {

            const amount = Number(aiResponse.amount);

            const personRollNumber =
                aiResponse.personRollNumber
                    ? aiResponse.personRollNumber.trim().toUpperCase()
                    : null;

            // Validate amount
            if (!Number.isFinite(amount) || amount <= 0) {
                return res.status(400).json({
                    message: "A valid debt amount is required.",
                    action: "create_debt"
                });
            }

            // Validate person
            if (!personRollNumber) {
                return res.status(400).json({
                    message: "I need the other person's roll number to create the debt.",
                    action: "create_debt"
                });
            }

            // Find the other user
            const person = await User.findOne({
                rollNumber: personRollNumber
            }).select("_id name rollNumber");

            if (!person) {
                return res.status(404).json({
                    message: `No registered user found with roll number ${personRollNumber}.`,
                    action: "create_debt"
                });
            }

            // Prevent creating a debt with yourself
            if (person._id.toString() === req.userId.toString()) {
                return res.status(400).json({
                    message: "You cannot create a debt with yourself.",
                    action: "create_debt"
                });
            }

            // Determine borrower and lender
            let borrower;
            let lender;

            if (aiResponse.direction === "you_owe_them") {
                borrower = req.userId;
                lender = person._id;
            } else if (aiResponse.direction === "they_owe_you") {
                borrower = person._id;
                lender = req.userId;
            } else {
                return res.status(400).json({
                    message: "I could not determine who owes whom.",
                    action: "create_debt"
                });
            }

            // Create the debt
            const newDebt = await Debt.create({
                borrower,
                lender,
                amount,
                description: aiResponse.description || "",
                status: "unpaid"
            });

            return res.json({
                message: "Debt created successfully.",
                action: "create_debt",
                debtId: newDebt._id,
                amount: newDebt.amount,
                description: newDebt.description,
                direction: aiResponse.direction,
                person: {
                    id: person._id,
                    name: person.name,
                    rollNumber: person.rollNumber
                }
            });
        }

        res.json({
            message: aiResponse.reply,
            action: ACTIONS.NONE
        });

    } catch (error) {
        console.error("Gemini chat error:", error);

        res.status(500).json({
            message: "Could not get a response from Gemini."
        });
    }
});

module.exports = router;