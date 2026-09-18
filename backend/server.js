const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const debtRoutes = require("./routes/debt");
const userRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/users", userRoutes);

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