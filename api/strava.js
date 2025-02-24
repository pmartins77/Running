const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();
const pool = require("./db"); // Connexion PostgreSQL

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REDIRECT_URI = "https://running-opal-mu.vercel.app/api/strava/callback";

// ✅ Vérifier que les clés API sont bien chargées
if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    console.error("❌ Erreur : STRAVA_CLIENT_ID ou STRAVA_CLIENT_SECRET non défini dans .env");
}

// 1️⃣ Route pour rediriger l'utilisateur vers Strava
router.get("/auth", (req, res) => {
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=activity:read_all`;
    res.redirect(authUrl);
});

// 2️⃣ Callback Strava : échange du code contre un token
router.get("/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("❌ Code d'autorisation manquant");
    }

    try {
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code"
        });

        const { access_token, refresh_token, expires_at, athlete } = response.data;

        // 🔹 Stocker les tokens en base
        const userId = 1; // Remplace par l’ID réel de l'utilisateur connecté
        await pool.query(
            "UPDATE users SET strava_id = $1, strava_token = $2, strava_refresh_token = $3, strava_expires_at = $4 WHERE id = $5",
            [athlete.id, access_token, refresh_token, expires_at, userId]
        );

        res.send("✅ Connexion Strava réussie et token stocké !");
    } catch (error) {
        console.error("❌ Erreur lors de l'échange du token :", error.response?.data || error.message);
        res.status(500).send("Erreur lors de l'authentification Strava");
    }
});

// 3️⃣ Récupération des activités avec toutes les données utiles
router.get("/activities", async (req, res) => {
    const userId = 1; // Remplace par l'ID réel de l'utilisateur connecté

    try {
        // 🔹 Récupérer le token Strava
        const userQuery = await pool.query("SELECT strava_token FROM users WHERE id = $1", [userId]);

        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_token) {
            return res.status(401).send("❌ Aucun token Strava trouvé pour cet utilisateur");
        }

        const accessToken = userQuery.rows[0].strava_token;

        // 🔹 Récupérer les activités Strava
        const response = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { per_page: 200 }
        });

        const activities = response.data;

        // 🔹 Insérer les activités en base
        for (const activity of activities) {
            await pool.query(
                `INSERT INTO trainings (user_id, strava_id, name, type, date, distance, elapsed_time, moving_time, average_speed, max_speed, 
                    average_cadence, average_heartrate, max_heartrate, calories, total_elevation_gain) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                 ON CONFLICT (strava_id) DO NOTHING`,
                [
                    userId, activity.id, activity.name, activity.sport_type, activity.start_date, activity.distance,
                    activity.elapsed_time, activity.moving_time, activity.average_speed, activity.max_speed,
                    activity.average_cadence, activity.average_heartrate, activity.max_heartrate,
                    activity.calories, activity.total_elevation_gain
                ]
            );
        }

        res.json({ message: "✅ Activités Strava récupérées et stockées en base !" });
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités :", error.response?.data || error.message);
        res.status(500).send("Erreur lors de la récupération des activités Strava");
    }
});

module.exports = router;
