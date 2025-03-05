const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const { year, month } = req.query;
        const userId = req.userId;

        if (!userId) {
            console.error("❌ Erreur : `req.userId` est undefined !");
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

        if (!year || !month || isNaN(year) || isNaN(month)) {
            console.error("❌ Erreur : Année et mois non valides !");
            return res.status(400).json({ error: "Année et mois requis et valides." });
        }

        console.log(`📌 Récupération des entraînements pour l'utilisateur ${userId}, année ${year}, mois ${month}`);

        const result = await pool.query(
            `SELECT id, user_id, date, type, duree, intensite, fc_cible, details, planifie_par_ai, 
                    echauffement, recuperation, charge, conseils
             FROM trainings 
             WHERE EXTRACT(YEAR FROM date) = $1 
             AND EXTRACT(MONTH FROM date) = $2 
             AND user_id = $3 
             ORDER BY date ASC
             LIMIT 50`,
            [parseInt(year, 10), parseInt(month, 10), userId]
        );

        if (result.rows.length === 0) {
            console.warn("⚠️ Aucun entraînement trouvé !");
            return res.status(200).json([]);
        }

        console.log(`✅ Entraînements trouvés :`, JSON.stringify(result.rows, null, 2));

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur serveur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
