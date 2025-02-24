const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();
const pool = require("./db"); // Connexion PostgreSQL

// 🔑 Clés API Strava (récupérées depuis .env)
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REDIRECT_URI = "https://running-opal-mu.vercel.app/api/strava/callback";

// 1️⃣ Route pour rediriger l'utilisateur vers l'authentification Strava
router.get("/auth", (req, res) => {
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=activity:read_all`;
    res.redirect(authUrl);
});

// 2️⃣ Route callback : échange du code contre un token Strava
router.get("/callback", async (req, res) => {
    const { code } = req.query; // Récupère le code Strava dans l’URL

    if (!code) {
        return res
