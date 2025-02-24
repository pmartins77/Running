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
            client_secret: STRAVA_CLIENT_
