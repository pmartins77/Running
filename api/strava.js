const express = require("express");
const axios = require("axios");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

require("dotenv").config();

const router = express.Router();

// ✅ Récupération du profil athlète avec données calculées
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Récupération du profil athlète pour l'utilisateur :", req.userId);

        const result = await pool.query(`
            SELECT 
                athlete.weight, 
                stats.all_run_totals_distance AS total_distance_run, 
                stats.recent_run_totals_distance AS recent_distance_run, 
                stats.recent_run_totals_moving_time AS recent_time_run,
                stats.all_ride_totals_distance AS total_distance_ride,
                stats.recent_ride_totals_distance AS recent_distance_ride
            FROM users 
            LEFT JOIN strava_athletes AS athlete ON users.strava_id = athlete.strava_id
            LEFT JOIN strava_stats AS stats ON users.strava_id = stats.strava_id
            WHERE users.id = $1
        `, [req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Profil athlète non trouvé." });
        }

        const profile = result.rows[0];

        // ✅ Calculs du profil athlète
        const trainingLoad = profile.recent_distance_run || 0;
        const progression = profile.total_distance_run > 0 
            ? ((trainingLoad / (profile.total_distance_run / 4)) * 100).toFixed(1)
            : 0;

        const vo2max = (profile.recent_distance_run / (profile.recent_time_run / 60)) * 3.5 || 0;

        // ✅ Récupération des activités récentes pour analyse
        const activitiesResult = await pool.query(`
            SELECT date, distance, average_speed AS avgSpeed, average_heartrate AS avgHeartRate
            FROM strava_activities 
            WHERE user_id = $1 
            ORDER BY date DESC 
            LIMIT 30
        `, [req.userId]);

        res.json({
            weight: profile.weight || "Non renseigné",
            trainingLoad,
            progression,
            vo2max: vo2max.toFixed(1),
            activities: activitiesResult.rows
        });
    } catch (error) {
        console.error("❌ Erreur lors de la récupération du profil athlète :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération du profil athlète." });
    }
});

module.exports = router;
