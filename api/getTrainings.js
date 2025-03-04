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

        if (!year || !month) {
            console.error("❌ Erreur : Année et mois non fournis !");
            return res.status(400).json({ error: "Année et mois requis." });
        }

        console.log(`📌 Récupération des entraînements pour l'utilisateur ${userId}, année ${year}, mois ${month}`);

        // 🔹 Requête SQL avec jointure pour récupérer le nom de l'objectif
        const result = await pool.query(
            `SELECT t.*, o.type AS objectif
             FROM trainings t
             LEFT JOIN objectifs o ON t.objectif_id = o.id
             WHERE EXTRACT(YEAR FROM t.date) = $1
             AND EXTRACT(MONTH FROM t.date) = $2
             AND t.user_id = $3
             AND t.is_generated = TRUE
             ORDER BY t.date ASC`,
            [year, month, userId]
        );

        if (result.rows.length === 0) {
            console.warn("⚠️ Aucun entraînement trouvé !");
            return res.status(200).json([]); // Retourne un tableau vide
        }

        console.log(`✅ ${result.rows.length} entraînements récupérés.`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur serveur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
