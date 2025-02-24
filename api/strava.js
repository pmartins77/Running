const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();
const pool = require("./db"); // Connexion PostgreSQL
const authMiddleware = require("./authMiddleware"); // Vérifie que l'utilisateur est connecté

// ✅ Charger les identifiants API Strava depuis .env
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;

// ✅ Vérifier que les clés API sont bien chargées
console.log("🔑 STRAVA_CLIENT_ID :", STRAVA_CLIENT_ID);
console.log("🔑 STRAVA_CLIENT_SECRET :", STRAVA_CLIENT_SECRET ? "OK" : "Non défini");
console.log("🔑 STRAVA_REDIRECT_URI :", STRAVA_REDIRECT_URI);

// 1️⃣ Route pour rediriger l'utilisateur vers Strava
router.get("/auth", authMiddleware, (req, res) => {
    const userId = req.userId; // 🔹 Correction pour correspondre à authMiddleware.js

    if (!userId) {
        return res.status(401).send("❌ Utilisateur non connecté.");
    }

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&scope=activity:read_all&state=${userId}`;
    res.redirect(authUrl);
});

// 2️⃣ Callback Strava : échange du code contre un token et l'associe à l'utilisateur
router.get("/callback", async (req, res) => {
    const { code, state } = req.query; // `state` contient l'ID utilisateur

    if (!code || !state) {
        return res.status(400).send("❌ Code d'autorisation ou ID utilisateur manquant.");
    }

    try {
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code"
        });

        const { access_token, refresh_token, expires_at, athlete } = response.data;
        const userId = state; // ID utilisateur récupéré depuis `state`

        // 🔹 Associer le compte Strava à l'utilisateur en base
        await pool.query(
            "UPDATE users SET strava_id = $1, strava_token = $2, strava_refresh_token = $3, strava_expires_at = $4 WHERE id = $5",
            [athlete.id, access_token, refresh_token, expires_at, userId]
        );

        res.send("✅ Connexion Strava réussie et associée à votre compte !");
    } catch (error) {
        console.error("❌ Erreur lors de l'échange du token :", error.response?.data || error.message);
        res.status(500).send("Erreur lors de l'authentification Strava");
    }
});

// 3️⃣ Récupération des entraînements Strava (chaque utilisateur voit ses propres entraînements)
router.get("/activities", authMiddleware, async (req, res) => {
    const userId = req.userId; // 🔹 Correction pour correspondre à authMiddleware.js

    try {
        // 🔹 Récupérer le token Strava de l'utilisateur
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
                `INSERT INTO trainings (user_id, strava_id, name, type, date, distance, elapsed_time, moving_time, 
                    average_speed, max_speed, average_cadence, average_heartrate, max_heartrate, calories, total_elevation_gain) 
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
