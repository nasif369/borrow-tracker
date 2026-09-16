const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();


// ==================== REGISTER ====================

router.post("/register", async (req, res) => {
    try {
        const { rollNumber, name, password } = req.body;

        const existingUser = await User.findOne({ rollNumber });

        if (existingUser) {
            return res.status(400).json({
                message: "Roll number already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            rollNumber,
            name,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                rollNumber: user.rollNumber,
                name: user.name
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});


// ==================== LOGIN ====================

router.post("/login", async (req, res) => {
    try {
        const { rollNumber, password } = req.body;

        const user = await User.findOne({ rollNumber });

        if (!user) {
            return res.status(400).json({
                message: "Invalid roll number or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(400).json({
                message: "Invalid roll number or password"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user._id,
                rollNumber: user.rollNumber,
                name: user.name
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});


module.exports = router;