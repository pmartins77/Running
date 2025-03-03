const express = require("express");
const router = express.Router();
const generateTrainingPlan = require("./planGenerator");
const authMiddleware = require("./authMiddleware");

router.post("/generate", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`📌 Génération du plan pour l'utilisateur ${userId}`);

        const plan = await generateTrainingPlan(userId);
        console.log(`✅ Plan généré avec succès :`, plan);

        res.json({ success: true, plan });
    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
