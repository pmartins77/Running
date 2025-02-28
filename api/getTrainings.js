const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// ✅ Récupération des entraînements de l'utilisateur connecté
router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Requête API getTrainings avec User ID :", req.userId);

        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ error: "Année et mois requis." });
        }

        // ✅ Vérification de la requête SQL (par utilisateur et par date)
        const result = await pool.query(
            `SELECT * FROM trainings 
             WHERE EXTRACT(YEAR FROM date) = $1 
             AND EXTRACT(MONTH FROM date) = $2 
             AND user_id = $3 
             ORDER BY date ASC`,
            [year, month, req.userId]
        );

        console.log("📌 Entraînements retournés :", result.rows);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error("❌ Erreur serveur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
