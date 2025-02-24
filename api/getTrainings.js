const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware"); // ✅ Ajout du middleware

const router = express.Router();

// ✅ Route pour récupérer les entraînements
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { year, month, date } = req.query;
        const userId = req.userId; // ✅ Récupération de l'utilisateur authentifié

        console.log("📌 Requête API getTrainings avec User ID :", userId);

        let query = "SELECT * FROM trainings WHERE user_id = $1";
        let params = [userId];

        if (year && month) {
            query += " AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3";
            params.push(year, month);
        } else if (date) {
            query += " AND date = $2";
            params.push(date);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Erreur récupération entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
