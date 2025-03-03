const express = require("express");
const router = express.Router();
const generateTrainingPlan = require("./planGenerator");
const authMiddleware = require("./authMiddleware");

router.post("/generate", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const plan = await generateTrainingPlan(userId);
        res.json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
