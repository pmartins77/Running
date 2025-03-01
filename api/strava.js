const express = require("express");
const axios = require("axios");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// ✅ Récupération et stockage des activités Strava
router.get("/activities", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Récupération des activités Strava pour l'utilisateur :", req.userId);

        // 1️⃣ Vérifier si un token Strava est disponible
        let userQuery = await pool.query("SELECT strava_token, strava_expires_at FROM users WHERE id = $1", [req.userId]);
        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_token) {
            return res.status(401).json({ error: "❌ Aucun token Strava trouvé pour cet utilisateur" });
        }

        let accessToken = userQuery.rows[0].strava_token;
        const expiresAt = userQuery.rows[0].strava_expires_at;
        const now = Math.floor(Date.now() / 1000);

        // 2️⃣ Rafraîchir le token Strava si expiré
        if (expiresAt < now) {
            console.log("🔄 Token Strava expiré, rafraîchissement en cours...");
            accessToken = await refreshStravaToken(req.userId);
            if (!accessToken) {
                return res.status(401).json({ error: "Impossible de rafraîchir le token Strava." });
            }
        }

        // 3️⃣ Récupérer les activités depuis Strava
        const response = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { per_page: 30 }
        });

        console.log(`✅ ${response.data.length} activités récupérées depuis Strava.`);

        // 4️⃣ Insérer ou mettre à jour les activités dans la base de données
        for (const activity of response.data) {
            await pool.query(
                `INSERT INTO trainings (
                    user_id, strava_id, name, date, distance, elapsed_time, moving_time, 
                    average_speed, max_speed, average_cadence, average_heartrate, 
                    max_heartrate, calories, total_elevation_gain
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (strava_id) 
                DO UPDATE SET 
                    distance = EXCLUDED.distance,
                    elapsed_time = EXCLUDED.elapsed_time,
                    moving_time = EXCLUDED.moving_time,
                    average_speed = EXCLUDED.average_speed,
                    max_speed = EXCLUDED.max_speed,
                    average_cadence = EXCLUDED.average_cadence,
                    average_heartrate = EXCLUDED.average_heartrate,
                    max_heartrate = EXCLUDED.max_heartrate,
                    calories = EXCLUDED.calories,
                    total_elevation_gain = EXCLUDED.total_elevation_gain;`,
                [
                    req.userId,
                    activity.id,
                    activity.name,
                    activity.start_date,
                    activity.distance / 1000, // Convertir en km
                    activity.elapsed_time,
                    activity.moving_time,
                    activity.average_speed * 3.6, // Convertir en km/h
                    activity.max_speed * 3.6, // Convertir en km/h
                    activity.average_cadence || null,
                    activity.average_heartrate || null,
                    activity.max_heartrate || null,
                    activity.calories || null,
                    activity.total_elevation_gain || null
                ]
            );
        }

        res.json({ message: "Importation réussie !", imported: response.data.length });
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités :", error.response?.data || error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des activités Strava" });
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
             FROM trainings 
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

// ✅ Importer les activités Strava pour l'utilisateur
router.post("/import", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Importation manuelle des activités Strava pour l'utilisateur :", req.userId);

        const userQuery = await pool.query("SELECT strava_token FROM users WHERE id = $1", [req.userId]);
        if (userQuery.rows.length === 0 || !userQuery.rows[0].strava_token) {
            return res.status(403).json({ error: "Compte Strava non connecté." });
        }

        const accessToken = userQuery.rows[0].strava_token;

        // Appeler la route pour récupérer et enregistrer les activités
        const response = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { per_page: 30 }
        });

        console.log(`✅ ${response.data.length} activités importées depuis Strava.`);

        for (const activity of response.data) {
            await pool.query(
                `INSERT INTO trainings (
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

module.exports = router;
