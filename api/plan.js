const express = require("express");
const router = express.Router();
const generateTrainingPlan = require("./planGenerator");
const authMiddleware = require("./authMiddleware");

router.post("/generate", authMiddleware, async (req, res) => {
    try {
        console.log("🔍 Vérification `req.userId` dans plan.js :", req.userId);
        
        const userId = req.userId;
        if (!userId) {
            console.error("❌ Erreur : `req.userId` est undefined !");
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

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
