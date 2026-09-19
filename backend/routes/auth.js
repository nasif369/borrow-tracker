const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const PendingUser = require("../models/PendingUser");

const router = express.Router();


// ===============================
// GMAIL TRANSPORTER
// ===============================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error) => {
    if (error) {
        console.log("Gmail transporter error:");
        console.log(error.message);
    } else {
        console.log("Gmail transporter is ready!");
    }
});


// ===============================
// REGISTER
// ===============================

router.post("/register", async (req, res) => {
    try {
        const {
            name,
            rollNumber,
            email,
            password
        } = req.body;

        if (!name || !rollNumber || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const cleanName = name.trim();
        const cleanRollNumber = rollNumber.trim().toUpperCase();
        const cleanEmail = email.trim().toLowerCase();

        // Check if already a COMPLETED user
        const existingUser = await User.findOne({
            $or: [
                { rollNumber: cleanRollNumber },
                { email: cleanEmail }
            ]
        });

        if (existingUser) {
            if (existingUser.email === cleanEmail) {
                return res.status(400).json({
                    message: "Email already registered"
                });
            }

            if (existingUser.rollNumber === cleanRollNumber) {
                return res.status(400).json({
                    message: "Roll number already registered"
                });
            }
        }

        // Check if there is an old pending registration
        const existingPending = await PendingUser.findOne({
            $or: [
                { rollNumber: cleanRollNumber },
                { email: cleanEmail }
            ]
        });

        // Remove old incomplete registration.
        // This allows the same email/roll number to be reused.
        if (existingPending) {
            await PendingUser.deleteOne({
                _id: existingPending._id
            });
        }

        // Generate OTP
        const verificationCode =
            Math.floor(100000 + Math.random() * 900000).toString();

        const verificationCodeExpires =
            new Date(Date.now() + 10 * 60 * 1000);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create ONLY a pending user.
        // It is NOT added to the real users collection.
        const pendingUser = new PendingUser({
            rollNumber: cleanRollNumber,
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpires
        });

        await pendingUser.save();

        try {
          await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: cleanEmail,
    subject: "Borrow Tracker - Email Verification",

    text: `Your Borrow Tracker verification OTP is ${verificationCode}. It expires in 10 minutes. If you did not request this, contact nasiftk5j@gmail.com`,

    html: `
        <p>Your Borrow Tracker verification OTP is:</p>

        <h2>${verificationCode}</h2>

        <p>This OTP expires in 10 minutes.</p>

        <p>
            If you did not request this,
            contact
            <a href="mailto:nasiftk5j@gmail.com">
                nasiftk5j@gmail.com
            </a>
        </p>
    `
});

            console.log(
                `Verification OTP sent to ${cleanEmail}`
            );

            return res.status(201).json({
                message: "Verification OTP sent"
            });

        } catch (emailError) {

            // If email fails, remove pending registration
            await PendingUser.deleteOne({
                _id: pendingUser._id
            });

            console.log("Email sending failed:");
            console.log(emailError.message);

            return res.status(500).json({
                message: "Could not send verification email"
            });
        }

    } catch (error) {

        console.log("Registration error:");
        console.log(error.message);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
});


// ===============================
// RESEND OTP
// ===============================

router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const pendingUser = await PendingUser.findOne({
            email: cleanEmail
        });

        if (!pendingUser) {
            return res.status(404).json({
                message: "No pending registration found for this email"
            });
        }

        const verificationCode =
            Math.floor(100000 + Math.random() * 900000).toString();

        pendingUser.verificationCode = verificationCode;

        pendingUser.verificationCodeExpires =
            new Date(Date.now() + 10 * 60 * 1000);

        await pendingUser.save();

       await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: cleanEmail,
    subject: "Borrow Tracker - New Verification OTP",

    text: `Your new Borrow Tracker verification OTP is ${verificationCode}. It expires in 10 minutes. If you did not request this, contact nasiftk5j@gmail.com`,

    html: `
        <p>Your new Borrow Tracker verification OTP is:</p>

        <h2>${verificationCode}</h2>

        <p>This OTP expires in 10 minutes.</p>

        <p>
            If you did not request this,
            contact
            <a href="mailto:nasiftk5j@gmail.com">
                nasiftk5j@gmail.com
            </a>
        </p>
    `
});
        console.log(
            `New verification OTP sent to ${cleanEmail}`
        );

        res.json({
            message: "A new OTP has been sent to your email"
        });

    } catch (error) {

        console.log("Resend OTP error:");
        console.log(error.message);

        res.status(500).json({
            message: "Could not resend OTP"
        });
    }
});


// ===============================
// VERIFY EMAIL
// ===============================

router.post("/verify-email", async (req, res) => {
    try {
        const {
            email,
            verificationCode
        } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).json({
                message: "Email and verification code are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const pendingUser = await PendingUser.findOne({
            email: cleanEmail
        });

        if (!pendingUser) {
            return res.status(404).json({
                message: "Registration not found or already completed"
            });
        }

        // Check OTP
        if (
            pendingUser.verificationCode !==
            verificationCode.trim()
        ) {
            return res.status(400).json({
                message: "Invalid verification code"
            });
        }

        // Check expiry
        if (
            pendingUser.verificationCodeExpires <
            new Date()
        ) {
            await PendingUser.deleteOne({
                _id: pendingUser._id
            });

            return res.status(400).json({
                message: "Verification code has expired. Please register again."
            });
        }

        // Make sure nobody completed registration
        // with this email or roll number meanwhile.
        const existingUser = await User.findOne({
            $or: [
                { email: pendingUser.email },
                { rollNumber: pendingUser.rollNumber }
            ]
        });

        if (existingUser) {
            await PendingUser.deleteOne({
                _id: pendingUser._id
            });

            return res.status(400).json({
                message: "Email or roll number is already registered"
            });
        }

        // ===============================
        // OTP SUCCESSFUL
        // NOW CREATE REAL USER
        // ===============================

        const user = new User({
            rollNumber: pendingUser.rollNumber,
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            emailVerified: true,
            verificationCode: null,
            verificationCodeExpires: null
        });

        await user.save();

        // Remove temporary registration
        await PendingUser.deleteOne({
            _id: pendingUser._id
        });

        console.log(
            `Email verified and user created: ${user.email}`
        );

        res.json({
            message: "Email verified successfully. Account created."
        });

    } catch (error) {

        console.log("Email verification error:");
        console.log(error.message);

        res.status(500).json({
            message: "Email verification failed"
        });
    }
});


// ===============================
// LOGIN
// ===============================

router.post("/login", async (req, res) => {
    try {
        const {
            rollNumber,
            password
        } = req.body;

        if (!rollNumber || !password) {
            return res.status(400).json({
                message: "Roll number and password are required"
            });
        }

        const cleanRollNumber = rollNumber.trim().toUpperCase();

        const user = await User.findOne({
            rollNumber: cleanRollNumber
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid roll number or password"
            });
        }

        // Users collection now contains only verified users,
        // but keep this check as an extra safety measure.
        if (!user.emailVerified) {
            return res.status(403).json({
                message: "Please verify your email first"
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
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                rollNumber: user.rollNumber,
                email: user.email
            }
        });

    } catch (error) {

        console.log("Login error:");
        console.log(error.message);

        res.status(500).json({
            message: "Login failed"
        });
    }
});


module.exports = router;