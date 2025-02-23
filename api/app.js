const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./auth");
const getTrainings = require("./getTrainings");
const upload = require("./upload");
const authMiddleware = require("./authMiddleware");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Vérification de la connexion PostgreSQL
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await db.pool.query("SELECT NOW()");
        res.json({ success: true, timestamp: result.rows[0].now });
    } catch (error) {
        console.error("❌ Erreur de connexion à PostgreSQL :", error);
        res.status(500).json({ error: "Erreur de connexion à PostgreSQL" });
    }
});

// ✅ Routes API
app.use("/api/auth", authRoutes);
app.use("/api/getTrainings", authMiddleware, getTrainings);
app.use("/api/upload", authMiddleware, upload);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app;
