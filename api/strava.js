const express = require("express");
const axios = require("axios");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

require("dotenv").config();

const router = express.Router();

// ✅ Fonction pour rafraîchir le token Strava si expiré
async function refreshStravaToken(userId) {
    try {
        const userQuery = await pool.query("SELECT strava_refresh_token FROM users WHERE id = $1", [userId]);
        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_refresh_token) {
            console.error("❌ Aucun token de rafraîchissement Strava trouvé.");
            return null;
        }

        const refreshToken = userQuery.rows[0].strava_refresh_token;
        const tokenResponse = await axios.post("https://www.strava.com/oauth/token", null, {
            params: {
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            },
        });

        const { access_token, refresh_token: newRefreshToken, expires_at } = tokenResponse.data;

        await pool.query(
            `UPDATE users SET strava_token = $1, strava_refresh_token = $2, strava_expires_at = $3 WHERE id = $4`,
            [access_token, newRefreshToken, expires_at, userId]
        );

        console.log("✅ Token Strava rafraîchi avec succès !");
        return access_token;
    } catch (error) {
        console.error("❌ Erreur lors du rafraîchissement du token Strava :", error.response?.data || error.message);
        return null;
    }
}

// ✅ Importer les activités Strava pour l'utilisateur (125 jours)
router.post("/import", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Importation des activités Strava pour l'utilisateur :", req.userId);

        const userQuery = await pool.query("SELECT strava_token, strava_expires_at FROM users WHERE id = $1", [req.userId]);
        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_token) {
            return res.status(403).json({ error: "Compte Strava non connecté." });
        }

        let accessToken = userQuery.rows[0].strava_token;
        const expiresAt = userQuery.rows[0].strava_expires_at;
        const now = Math.floor(Date.now() / 1000);

        if (expiresAt < now) {
            console.log("🔄 Token Strava expiré, rafraîchissement en cours...");
            accessToken = await refreshStravaToken(req.userId);
            if (!accessToken) {
                return res.status(401).json({ error: "Impossible de rafraîchir le token Strava." });
            }
        }

        const response = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { per_page: 200 } // On récupère plus d'activités (jusqu'à 200)
        });

        console.log(`✅ ${response.data.length} activités récupérées depuis Strava.`);

        const nowDate = new Date();
        const oneHundredTwentyFiveDaysAgo = new Date();
        oneHundredTwentyFiveDaysAgo.setDate(nowDate.getDate() - 125);

        const filteredActivities = response.data.filter(activity => {
            const activityDate = new Date(activity.start_date);
            return activityDate >= oneHundredTwentyFiveDaysAgo;
        });

        console.log(`✅ ${filteredActivities.length} activités filtrées sur les 125 derniers jours.`);

        for (const activity of filteredActivities) {
            await pool.query(
                `INSERT INTO strava_activities (
                    user_id, strava_id, name, date, distance, elapsed_time, moving_time, 
                    average_speed, max_speed, average_cadence, average_heartrate, 
                    max_heartrate, calories, total_elevation_gain
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (strava_id) DO NOTHING;`,
                [
                    req.userId,
                    activity.id,
                    activity.name,
                    activity.start_date,
                    activity.distance / 1000, // Conversion en km
                    Math.round(activity.elapsed_time / 60), // Temps total en minutes
                    Math.round(activity.moving_time / 60), // Temps en mouvement
                    activity.average_speed * 3.6, // Conversion m/s → km/h
                    activity.max_speed * 3.6, // Conversion m/s → km/h
                    activity.average_cadence || null,
                    activity.average_heartrate || null,
                    activity.max_heartrate || null,
                    activity.calories || null,
                    activity.total_elevation_gain || null
                ]
            );
        }

        res.json({ message: "Importation Strava réussie", imported: filteredActivities.length });
    } catch (error) {
        console.error("❌ Erreur lors de l'importation Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'importation des activités Strava." });
    }
});

// ✅ Récupération des activités Strava stockées
router.get("/list", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Récupératio
