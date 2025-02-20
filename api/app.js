const express = require("express");
const cors = require("cors");
require("dotenv").config();
const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");
const { pool } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Route temporaire pour tester la connexion PostgreSQL
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "✅ Connexion à PostgreSQL réussie !", time: result.rows[0] });
    } catch (error) {
        console.error("❌ Erreur lors de la connexion à PostgreSQL :", error);
        res.status(500).json({ error: "Erreur lors de la connexion à la base de données." });
    }
});

// 🔹 Routes API
app.use("/api/getTrainings", getTrainings);
app.use("/api/deleteAll", deleteAll);
app.use("/api/upload", upload);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur API démarré sur le port ${PORT}`));
