const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const pool = require("./db");

// 1️⃣ **Corriger les types des données avant insertion**
async function insertStravaActivity(activity, userId) {
    try {
        await pool.query(
            `INSERT INTO strava_activities (user_id, strava_id, name, type, date, distance, elapsed_time, moving_time, 
                average_speed, max_speed, average_cadence, average_heartrate, max_heartrate, calories, total_elevation_gain) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (strava_id) DO NOTHING`,
            [
                userId,
                activity.id,
                activity.name,
                activity.sport_type,
                activity.start_date,
                parseFloat(activity.distance) || 0,  // 🔹 Convertir distance en float
                parseInt(activity.elapsed_time) || 0, // 🔹 Convertir en integer
                parseInt(activity.moving_time) || 0,
                parseFloat(activity.average_speed) || 0,
                parseFloat(activity.max_speed) || 0,
                parseFloat(activity.average_cadence) || 0,
                parseFloat(activity.average_heartrate) || 0,
                parseFloat(activity.max_heartrate) || 0,
                parseFloat(activity.calories) || 0,
                parseFloat(activity.total_elevation_gain) || 0
            ]
        );
    } catch (error) {
        console.error("❌ Erreur lors de l'insertion des activités Strava :", error);
    }
}

// 2️⃣ **Récupération des activités et correction des types**
router.get("/activities", async (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(401).json({ error: "Accès interdit. Token manquant." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        if (!userId) {
            return res.status(401).json({ error: "Utilisateur invalide." });
        }

        const activities = []; // 🔹 Simulation des activités récupérées

        for (const activity of activities) {
            await insertStravaActivity(activity, userId);
        }

        res.json({ message: `✅ ${activities.length} activités Strava récupérées et stockées en base !` });
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des activités Strava" });
    }
});

module.exports = router;
