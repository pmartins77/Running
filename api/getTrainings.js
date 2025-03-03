const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const { year, month } = req.query;
        const userId = req.user.id;

        if (!year || !month) {
            return res.status(400).json({ error: "Année et mois requis." });
        }

        console.log(`📌 Récupération des entraînements pour l'utilisateur ${userId}, année ${year}, mois ${month}`);

        const result = await pool.query(
            `SELECT * FROM trainings 
             WHERE EXTRACT(YEAR FROM date) = $1 
             AND EXTRACT(MONTH FROM date) = $2 
             AND user_id = $3 
             AND is_generated = TRUE
             ORDER BY date ASC`,
            [year, month, userId]
        );

        console.log(`📌 Entraînements trouvés :`, result.rows);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur serveur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
