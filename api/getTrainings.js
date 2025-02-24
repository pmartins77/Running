const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// ✅ Récupération des entraînements de l'utilisateur connecté
router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Requête API getTrainings avec User ID :", req.userId);

        const { date, year, month } = req.query;
        let query;
        let values;

        if (date) {
            query = `SELECT * FROM trainings WHERE date = $1 AND user_id = $2`;
            values = [date, req.userId];
        } else if (year && month) {
            query = `SELECT * FROM trainings WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 AND user_id = $3`;
            values = [year, month, req.userId];
        } else {
            return res.status(400).json({ error: "Paramètres date ou année/mois requis." });
        }

        const result = await pool.query(query, values);

        console.log("📌 Données retournées :", result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur serveur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
