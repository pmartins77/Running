const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ error: "Année et mois requis." });
        }

        // 🔹 Récupérer uniquement les entraînements générés (`is_generated = TRUE`)
        const result = await pool.query(
            `SELECT * FROM trainings 
             WHERE EXTRACT(YEAR FROM date) = $1 
             AND EXTRACT(MONTH FROM date) = $2 
             AND user_id = $3 
             AND is_generated = TRUE
             ORDER BY date ASC`,
            [year, month, req.userId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur serveur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
