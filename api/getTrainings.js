const express = require("express");
const router = express.Router();
const db = require("./db");
const authMiddleware = require("./authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.warn("⚠️ Problème d'authentification dans getTrainings : `req.user.id` est undefined.");
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

        console.log(`📌 Récupération des entraînements pour l'utilisateur ID : ${req.user.id}`);

        const result = await db.query("SELECT * FROM trainings WHERE user_id = $1", [req.user.id]);

        console.log("✅ Entraînements retournés :", result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ ERREUR dans getTrainings :", err.stack);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

module.exports = router;
