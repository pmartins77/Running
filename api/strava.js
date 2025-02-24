const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();
const pool = require("./db"); // Connexion PostgreSQL

// 🔑 Clés API Strava (récupérées depuis .env)
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REDIRECT_URI = "https://running-opal-mu.vercel.app/api/strava/callback";

// ✅ Vérifier si les clés API sont bien chargées
if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    console.error("❌ Erreur : STRAVA_CLIENT_ID ou STRAVA_CLIENT_SECRET non défini dans .env");
}

// 1️⃣ Route pour rediriger l'utilisateur vers l'authentification Strava
router.get("/auth", (req, res) => {
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=activity:read_all`;
    res.redirect(authUrl);
});

// 2️⃣ Route callback : échange du code contre un token Strava
router.get("/callback", async (req, res) => {
    const { code } = req.query; // Récupère le code Strava dans l’URL

    if (!code) {
        return res.status(400).send("❌ Code d'autorisation manquant");
    }

    try {
        // 🔄 Échange du code contre un token d'accès
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code"
        });

        const { access_token, refresh_token, expires_at, athlete } = response.data;

        // 🔹 Vérifier si les données sont bien reçues
        if (!access_token || !athlete) {
            console.error("❌ Erreur : Données Strava incomplètes");
            return res.status(500).send("Erreur lors de l'authentification Strava");
        }

        // 🔹 Stocker l’athlète et son token en base de données
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

module.exports = router;
