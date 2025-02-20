// /api/app.js (Serveur Express)
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db"); // ✅ Charge la connexion PostgreSQL dès le début
const authRoutes = require("./auth"); // ✅ Routes d'authentification
const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Vérification de la connexion PostgreSQL
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await db.pool.query("SELECT NOW()");
        res.json({ success: true, timestamp: result.rows[0].now });
    } catch (error) {
        console.error("❌ Erreur connexion PostgreSQL :", error);
        res.status(500).json({ error: "Erreur de connexion à PostgreSQL" });
    }
});

// ✅ Vérification des variables d’environnement
app.get("/api/check-env", (req, res) => {
    res.json({ DATABASE_URL: process.env.DATABASE_URL || "❌ Variable introuvable" });
});

// ✅ Routes API
app.use("/api/auth", authRoutes); // ✅ Ajout de l'authentification
app.use("/api/getTrainings", getTrainings);
app.use("/api/deleteAll", deleteAll);
app.use("/api/upload", upload);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app; // Indispensable pour Vercel
