const express = require("express");
const cors = require("cors");
require("dotenv").config();

const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");
const authRoutes = require("./auth");
const authMiddleware = require("./authMiddleware");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/test-db", async (req, res) => {
    try {
        const client = await db.pool.connect();
        const result = await client.query("SELECT NOW()");
        client.release();
        res.json({ success: true, timestamp: result.rows[0].now });
    } catch (error) {
        console.error("❌ Erreur connexion PostgreSQL :", error);
        res.status(500).json({ error: "Erreur de connexion à PostgreSQL" });
    }
});

// ✅ Routes API
app.use("/api/auth", authRoutes);
app.use("/api/getTrainings", authMiddleware, getTrainings);
app.use("/api/deleteAll", authMiddleware, deleteAll);
app.use("/api/upload", authMiddleware, upload);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app;
