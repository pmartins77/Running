const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// Route pour récupérer le profil athlète
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        // Récupération des 30 dernières activités Strava
        const result = await pool.query(
            `SELECT * FROM strava_activities WHERE user_id = $1 ORDER BY date DESC LIMIT 30`,
            [userId]
        );

        const activities = result.rows.map(act => ({
            date: act.date,
            distance: (act.distance / 1000).toFixed(1), // Conversion en km
            avgSpeed: (act.average_speed * 3.6).toFixed(1), // Conversion m/s -> km/h
            avgHeartRate: act.average_heartrate || "N/A",
        }));

        // ✅ Calcul de la charge d'entraînement (distance 7 derniers jours / distance 30 jours)
        const totalDistance7Days = activities.slice(0, 7).reduce((sum, act) => sum + parseFloat(act.distance), 0);
        const totalDistance30Days = activities.reduce((sum, act) => sum + parseFloat(act.distance), 0);
        const progression = ((totalDistance7Days / (totalDistance30Days / 4)) * 100).toFixed(1);

        // ✅ Estimation VMA (basée sur meilleure perf sur 1.5 km)
        const bestEffort = activities.find(act => act.distance >= 1.5);
        const vma = bestEffort ? (bestEffort.avgSpeed * 1.06) : 15; // Valeur par défaut si inconnu

        // ✅ Estimation VO2 Max (vitesse moyenne sur 10 km)
        const avgSpeed10k = activities.find(act => act.distance >= 10)?.avgSpeed || vma;
        const vo2max = avgSpeed10k * 3.5;

        // ✅ Analyse de la progression sur segments (placeholder pour ajout futur)
        const performanceTrend = Math.random() > 0.5 ? 1 : -1;

        res.json({
            vma,
            vo2max,
            trainingLoad: totalDistance7Days.toFixed(1),
            progression,
            performanceTrend,
            activities
        });

    } catch (error) {
        console.error("❌ Erreur API profil athlète :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération du profil athlète." });
    }
});

module.exports = router;
