const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const debtRoutes = require("./routes/debt");
const userRoutes = require("./routes/users");
const aiRoutes = require("./routes/ai");
const {
    getGmailClient,
    SCOPES,
    handleOAuthCallback
} = require("./utils/gmail");
const app = express();

app.use(cors());
app.use(express.json());
app.get("/oauth2callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).send(
                "Authorization code is missing."
            );
        }

        await handleOAuthCallback(code);

        res.send(`
            <h2>Gmail connected successfully!</h2>
            <p>You can close this window and return to Borrow Tracker.</p>
        `);

    } catch (error) {
        console.error(
            "Gmail OAuth callback error:",
            error
        );

        res.status(500).send(
            "Gmail authorization failed."
        );
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
    res.send("Borrow Tracker Backend is working!");
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected!");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed:");
        console.log(error.message);
    });