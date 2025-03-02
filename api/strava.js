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

// ✅ Connexion à Strava
router.get("/connect", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Connexion à Strava demandée par l'utilisateur :", req.userId);
        const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${process.env.STRAVA_REDIRECT_URI}&scope=activity:read_all,profile:read_all&approval_prompt=force&state=${req.userId}`;
        res.json({ auth_url: stravaAuthUrl });
    } catch (error) {
        console.error("❌ Erreur lors de la connexion à Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion à Strava." });
    }
});

// ✅ Callback Strava après l'autorisation
router.get("/callback", async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).json({ error: "Code d'autorisation ou identifiant utilisateur manquant." });
    }

    try {
        console.log("📌 Échange du code Strava pour un token...");

        const tokenResponse = await axios.post("https://www.strava.com/oauth/token", null, {
            params: {
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                code: code,
                grant_type: "authorization_code"
            }
        });

        const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

        if (!athlete || !athlete.id) {
            throw new Error("Données Strava incomplètes.");
        }

        console.log("✅ Stockage du compte Strava dans la base...");

        await pool.query(
            `UPDATE users 
             SET strava_id = $1, strava_token = $2, strava_refresh_token = $3, strava_expires_at = $4 
             WHERE id = $5`,
            [athlete.id, access_token, refresh_token, expires_at, state]
        );

        console.log("✅ Compte Strava connecté avec succès !");
        res.redirect("/strava.html");
    } catch (error) {
        console.error("❌ Erreur lors de l'échange du code Strava :", error.response?.data || error.message);
        res.status(500).json({ error: "Erreur serveur lors de l'échange du code Strava." });
    }
});

// ✅ Déconnexion de Strava
router.post("/disconnect", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Déconnexion de Strava pour l'utilisateur :", req.userId);
        await pool.query(
            `UPDATE users SET strava_id = NULL, strava_token = NULL, strava_refresh_token = NULL, strava_expires_at = NULL WHERE id = $1`,
            [req.userId]
        );

        res.json({ message: "Compte Strava déconnecté avec succès." });
    } catch (error) {
        console.error("❌ Erreur lors de la déconnexion de Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de la déconnexion de Strava." });
    }
});

// ✅ Importer les activités Strava pour l'utilisateur
router.post("/import", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Importation manuelle des activités Strava pour l'utilisateur :", req.userId);

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
            params: { per_page: 30 }
        });

        console.log(`✅ ${response.data.length} activités importées depuis Strava.`);

        for (const activity of response.data) {
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
                    activity.distance / 1000,
                    activity.elapsed_time,
                    activity.moving_time,
                    activity.average_speed * 3.6,
                    activity.max_speed * 3.6,
                    activity.average_cadence || null,
                    activity.average_heartrate || null,
                    activity.max_heartrate || null,
                    activity.calories || null,
                    activity.total_elevation_gain || null
                ]
            );
        }

        res.json({ message: "Importation Strava réussie", imported: response.data.length });
    } catch (error) {
        console.error("❌ Erreur lors de l'importation Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'importation des activités Strava." });
    }
});

// ✅ Route pour récupérer les activités stockées en base
router.get("/list", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Récupération des activités Strava stockées pour l'utilisateur :", req.userId);

        const result = await pool.query(`SELECT * FROM strava_activities WHERE user_id = $1 ORDER BY date DESC`, [req.userId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des activités Strava." });
    }
});

module.exports = router;
