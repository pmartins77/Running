const express = require("express");
const pool = require("./db"); // ✅ Import correct de la base de données
const authMiddleware = require("./authMiddleware"); // ✅ Vérification du token

const router = express.Router();

router.delete("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId; // ✅ Récupérer l'utilisateur connecté depuis le middleware

        console.log("📌 Suppression des entraînements pour l'utilisateur ID :", userId);

        if (!userId) {
            return res.status(403).json({ error: "Accès interdit. Token invalide." });
        }

        // ✅ Suppression sécurisée des entraînements de l'utilisateur connecté
        await pool.query("DELETE FROM trainings WHERE user_id = $1", [userId]);

        console.log("✅ Tous les entraînements ont été supprimés !");
        res.status(200).json({ message: "Tous les entraînements ont été supprimés avec succès." });

    } catch (error) {
        console.error("❌ Erreur suppression :", error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression des entraînements." });
    }
});

module.exports = router;
