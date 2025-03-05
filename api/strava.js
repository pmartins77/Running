const express = require("express");
const axios = require("axios");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

require("dotenv").config();

const router = express.Router();

// ✅ Fonction pour récupérer le profil athlète avec ses performances
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Récupération du profil athlète pour l'utilisateur :", req.userId);

        const result = await pool.query(`
            SELECT 
                u.weight AS poids,
                s.recent_run_totals_distance AS recent_distance_run,
                s.recent_run_totals_moving_time AS recent_time_run,
                s.all_run_totals_distance AS total_distance_run
            FROM users u
            LEFT JOIN strava_stats s ON u.strava_id = s.strava_id
            WHERE u.id = $1
        `, [req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Profil athlète non trouvé." });
        }

        const profile = result.rows[0];

        // ✅ Calcul de la charge d'entraînement et de la progression
        const trainingLoad = profile.recent_distance_run || 0;
        const progression = profile.total_distance_run > 0 
            ? ((trainingLoad / (profile.total_distance_run / 4)) * 100).toFixed(1)
            : 0;

        // ✅ Estimation du VO2 max (si données disponibles)
        const vo2max = (profile.recent_distance_run / (profile.recent_time_run / 60)) * 3.5 || 0;

        res.json({
            poids: profile.poids || "Non renseigné",
            trainingLoad,
            progression,
            vo2max: vo2max.toFixed(1),
        });

    } catch (error) {
        console.error("❌ Erreur lors de la récupération du profil athlète :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération du profil athlète." });
    }
});

module.exports = router;
