const express = require("express");
const axios = require("axios");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

require("dotenv").config();

const router = express.Router();

// ✅ Connexion à Strava (Redirection vers l'URL d'autorisation)
router.get("/connect", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Connexion à Strava demandée par l'utilisateur :", req.userId);

        // Construire l'URL d'autorisation Strava
        const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${process.env.STRAVA_REDIRECT_URI}&scope=activity:read_all,profile:read_all&approval_prompt=force`;

        res.json({ auth_url: stravaAuthUrl });
    } catch (error) {
        console.error("❌ Erreur lors de la connexion à Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion à Strava." });
    }
});

// ✅ Callback Strava après l'autorisation
router.get("/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.status(400).json({ error: "Code d'autorisation manquant." });
    }

    try {
        console.log("📌 Échange du code Strava pour un token...");

        // Récupérer le token d'accès Strava
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

        // Vérifier si l'utilisateur existe dans la base
        const existingUser = await pool.query("SELECT id FROM users WHERE strava_id = $1", [athlete.id]);

        if (existingUser.rows.length > 0) {
            // Mise à jour des tokens si l'utilisateur est déjà connecté à Strava
            await pool.query(
                `UPDATE users SET strava_token = $1, strava_refresh_token = $2, strava_expires_at = $3 WHERE strava_id = $4`,
                [access_token, refresh_token, expires_at, athlete.id]
            );
        } else {
            // Associer le compte Strava à l'utilisateur connecté
            await pool.query(
                `UPDATE users SET strava_id = $1, strava_token = $2, strava_refresh_token = $3, strava_expires_at = $4 WHERE id = $5`,
                [athlete.id, access_token, refresh_token, expires_at, req.userId]
            );
        }

        console.log("✅ Compte Strava connecté avec succès !");
        res.redirect("/strava.html"); // Redirection vers la page des activités
    } catch (error) {
        console.error("❌ Erreur lors de l'échange du code Strava :", error.response?.data || error.message);
        res.status(500).json({ error: "Erreur serveur lors de l'échange du code Strava." });
    }
});

// ✅ Importer les activités Strava pour l'utilisateur
router.post("/import", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Importation manuelle des activités Strava pour l'utilisateur :", req.userId);

        const userQuery = await pool.query("SELECT strava_token FROM users WHERE id = $1", [req.userId]);
        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_token) {
            return res.status(403).json({ error: "Compte Strava non connecté." });
        }

        const accessToken = userQuery.rows[0].strava_token;

        // Appeler l'API Strava pour récupérer les activités
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

// ✅ Récupérer les activités stockées dans la base
router.get("/list", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Récupération des activités Strava stockées pour l'utilisateur :", req.userId);

        const result = await pool.query(
            `SELECT name, date, distance, elapsed_time, moving_time, average_speed, 
                    max_speed, average_cadence, average_heartrate, max_heartrate, 
                    calories, total_elevation_gain 
             FROM strava_activities 
             WHERE user_id = $1 
             ORDER BY date DESC`,
            [req.userId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des activités Strava." });
    }
});

module.exports = router;
