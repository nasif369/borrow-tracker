const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// SEARCH USERS
router.get("/search", authMiddleware, async (req, res) => {
    try {
        const query = (req.query.q || "").trim();

        const currentUser = await User.findById(req.userId);

        if (!currentUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        let users;

        // No search text:
        // show the latest 8 registered users
        if (!query) {
            users = await User.find({
                _id: { $ne: req.userId }
            })
                .select("name rollNumber")
                .sort({ _id: -1 })
                .limit(8);
        } else {
            // Search by name OR roll number
            users = await User.find({
                _id: { $ne: req.userId },
                $or: [
                    {
                        name: {
                            $regex: query,
                            $options: "i"
                        }
                    },
                    {
                        rollNumber: {
                            $regex: query,
                            $options: "i"
                        }
                    }
                ]
            })
                .select("name rollNumber")
                .sort({ name: 1 })
                .limit(10);
        }

        res.json({
            users: users
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to search users",
            error: error.message
        });
    }
});

module.exports = router;