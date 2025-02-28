const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

// ✅ Charger les identifiants API Strava depuis .env
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;

console.log("🔑 STRAVA_CLIENT_ID :", STRAVA_CLIENT_ID);
console.log("🔑 STRAVA_CLIENT_SECRET :", STRAVA_CLIENT_SECRET ? "OK" : "Non défini");
console.log("🔑 STRAVA_REDIRECT_URI :", STRAVA_REDIRECT_URI);

// 1️⃣ **Rediriger l'utilisateur vers Strava**
router.get("/auth", (req, res) => {
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

        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&scope=activity:read_all&state=${userId}`;
        res.redirect(authUrl);
    } catch (error) {
        console.error("❌ Erreur JWT :", error.message);
        res.status(401).json({ error: "Token invalide." });
    }
});

// 2️⃣ **Callback Strava : Associer l'utilisateur et enregistrer son token**
router.get("/callback", async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) {
        return res.status(400).json({ error: "❌ Code d'autorisation ou ID utilisateur manquant." });
    }

    try {
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code,
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

// 3️⃣ **Rafraîchir le token Strava si expiré**
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

// 4️⃣ **Récupération et stockage des activités Strava**
router.get("/activities", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Récupération des activités Strava pour l'utilisateur :", req.userId);

        let userQuery = await pool.query("SELECT strava_token, strava_expires_at FROM users WHERE id = $1", [req.userId]);
        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_token) {
            return res.status(401).json({ error: "❌ Aucun token Strava trouvé pour cet utilisateur" });
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
            params: { per_page: 30 }
        });

        // ✅ Insérer les activités dans la base de données
        for (const activity of response.data) {
            await pool.query(
                `INSERT INTO strava_activities (user_id, strava_id, name, date, distance, elapsed_time, moving_time, average_speed, max_speed, average_cadence, average_heartrate, max_heartrate, calories, total_elevation_gain)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (strava_id) DO NOTHING;`,
                [req.userId, activity.id, activity.name, activity.start_date, activity.distance, activity.elapsed_time,
                 activity.moving_time, activity.average_speed, activity.max_speed, activity.average_cadence,
                 activity.average_heartrate, activity.max_heartrate, activity.calories, activity.total_elevation_gain]
            );
        }

        res.json(response.data);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités :", error.response?.data || error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des activités Strava" });
    }
});

// 5️⃣ **Récupérer les activités Strava stockées dans la base**
router.get("/list", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Récupération des activités Strava stockées pour l'utilisateur :", req.userId);

        const result = await pool.query(
            "SELECT * FROM strava_activities WHERE user_id = $1 ORDER BY date DESC",
            [req.userId]
        );

        console.log("✅ Activités Strava récupérées :", result.rows.length);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des activités Strava." });
    }
});

module.exports = router;
