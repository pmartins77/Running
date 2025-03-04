const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// ✅ Route pour supprimer tous les entraînements d'un utilisateur
router.delete("/", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Suppression des entraînements pour l'utilisateur ID :", req.userId);

        const result = await pool.query("DELETE FROM trainings WHERE user_id = $1", [req.userId]);

        console.log(`✅ ${result.rowCount} entraînements supprimés.`);
        res.status(200).json({ message: "✅ Tous vos entraînements ont été supprimés avec succès !" });

    } catch (error) {
        console.error("❌ Erreur lors de la suppression des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression des entraînements." });
    }
});

module.exports = router;
