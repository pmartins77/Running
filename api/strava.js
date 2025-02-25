const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const pool = require("./db"); // Connexion PostgreSQL

// ✅ Charger les identifiants API Strava depuis .env
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;

console.log("🔑 STRAVA_CLIENT_ID :", STRAVA_CLIENT_ID);
console.log("🔑 STRAVA_CLIENT_SECRET :", STRAVA_CLIENT_SECRET ? "OK" : "Non défini");
console.log("🔑 STRAVA_REDIRECT_URI :", STRAVA_REDIRECT_URI);

// 1️⃣ **Route pour rediriger l'utilisateur vers Strava**
router.get("/auth", (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(401).json({ error: "Accès interdit. Token manquant." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token JWT valide :", decoded);

        const userId = decoded.userId;

        if (!userId) {
            return res.status(401).json({ error: "Utilisateur invalide." });
        }

        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&scope=activity:read_all&state=${userId}`;

        console.log("🔗 Redirection vers Strava :", authUrl);
        res.redirect(authUrl);
    } catch (error) {
        console.error("❌ Erreur JWT :", error.message);
        res.status(401).json({ error: "Token invalide." });
    }
});

// 2️⃣ **Callback Strava : échange du code contre un token et association à l'utilisateur**
router.get("/callback", async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).json({ error: "❌ Code d'autorisation ou ID utilisateur manquant." });
    }

    try {
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code"
        });

        const { access_token, refresh_token, expires_at, athlete } = response.data;
        const userId = state;

        await pool.query(
            "UPDATE users SET strava_id = $1, strava_token = $2, strava_refresh_token = $3, strava_expires_at = $4 WHERE id = $5",
            [athlete.id, access_token, refresh_token, expires_at, userId]
        );

        res.send("✅ Connexion Strava réussie et associée à votre compte !");
    } catch (error) {
        console.error("❌ Erreur lors de l'échange du token :", error.response?.data || error.message);
        res.status(500).json({ error: "Erreur lors de l'authentification Strava" });
    }
});

// 3️⃣ **Fonction pour rafraîchir le token Strava**
async function refreshStravaToken(userId) {
    try {
        const userQuery = await pool.query("SELECT strava_refresh_token FROM users WHERE id = $1", [userId]);

        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_refresh_token) {
            console.error("❌ Aucun refresh_token trouvé pour l'utilisateur :", userId);
            return null;
        }

        const refreshToken = userQuery.rows[0].strava_refresh_token;

        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: refreshToken
        });

        const { access_token, refresh_token: newRefreshToken, expires_at } = response.data;

        await pool.query(
            "UPDATE users SET strava_token = $1, strava_refresh_token = $2, strava_expires_at = $3 WHERE id = $4",
            [access_token, newRefreshToken, expires_at, userId]
        );

        console.log("✅ Token Strava mis à jour pour l'utilisateur", userId);
        return access_token;
    } catch (error) {
        console.error("❌ Erreur lors du rafraîchissement du token Strava :", error.response?.data || error.message);
        return null;
    }
}

// 4️⃣ **Récupération des activités Strava et enregistrement dans `strava_activities`**
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

        let userQuery = await pool.query("SELECT strava_token, strava_expires_at FROM users WHERE id = $1", [userId]);

        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_token) {
            return res.status(401).json({ error: "❌ Aucun token Strava trouvé pour cet utilisateur" });
        }

        let accessToken = userQuery.rows[0].strava_token;
        const expiresAt = userQuery.rows[0].strava_expires_at;

        const now = Math.floor(Date.now() / 1000);
        if (expiresAt < now) {
            console.log("🔄 Token Strava expiré, rafraîchissement en cours...");
            accessToken = await refreshStravaToken(userId);

            if (!accessToken) {
                return res.status(401).json({ error: "Impossible de rafraîchir le token Strava." });
            }
        }

        let allActivities = [];
        let page = 1;
        const limit = 3;

        while (page <= limit) {
            console.log(`📌 Récupération des activités - Page ${page}`);
            const response = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { per_page: 20, page: page }
            });

            const activities = response.data;
            if (activities.length === 0) break;

            allActivities.push(...activities);
            page++;
        }

        console.log(`✅ ${allActivities.length} activités récupérées.`);

        for (const activity of allActivities) {
            await pool.query(
                `INSERT INTO strava_activities (user_id, strava_id, name, type, date, distance, elapsed_time, moving_time, 
                    average_speed, max_speed, average_cadence, average_heartrate, max_heartrate, calories, total_elevation_gain) 
                 VALUES ($1, $2, $3, $4, $5, $6/1000, $7/60, $8/60, $9*3.6, $10*3.6, $11, $12, $13, $14, $15)
                 ON CONFLICT (strava_id) DO NOTHING`,
                [
                    userId, activity.id, activity.name, activity.sport_type, activity.start_date, activity.distance,
                    activity.elapsed_time, activity.moving_time, activity.average_speed, activity.max_speed,
                    activity.average_cadence, activity.average_heartrate, activity.max_heartrate,
                    activity.calories, activity.total_elevation_gain
                ]
            );
        }

        res.json({ message: `✅ ${allActivities.length} activités Strava récupérées et stockées en base !` });
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités :", error.response?.data || error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des activités Strava" });
    }
});

// 5️⃣ **Route pour récupérer les activités stockées dans la base**
router.get("/list", async (req, res) => {
    try {
        const activities = await pool.query("SELECT * FROM strava_activities ORDER BY date DESC");
        res.json(activities.rows);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités :", error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des activités Strava" });
    }
});

module.exports = router;
