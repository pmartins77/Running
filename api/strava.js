const express = require("express");
const axios = require("axios");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

require("dotenv").config();

const router = express.Router();

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

module.exports = router;
