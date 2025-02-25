const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// ✅ Route pour récupérer les entraînements d'un utilisateur
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query("SELECT * FROM trainings WHERE user_id = $1", [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des entraînements." });
    }
});

module.exports = router;
