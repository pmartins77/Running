const express = require("express");
const cors = require("cors");
require("dotenv").config();
const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");
const authRoutes = require("./auth");
const stravaRoutes = require("./strava");

const app = express();
app.use(cors());
app.use(express.json());

console.log("📌 Démarrage du serveur...");
console.log("📌 Configuration des routes API :");

app.use("/api/auth", authRoutes);
console.log("  - Route /api/auth chargée ✅");

app.use("/api/strava", stravaRoutes);
console.log("  - Route /api/strava chargée ✅");

app.use("/api/getTrainings", getTrainings);
console.log("  - Route /api/getTrainings chargée ✅");

app.use("/api/deleteAll", deleteAll);
console.log("  - Route /api/deleteAll chargée ✅");

app.use("/api/upload", upload);
console.log("  - Route /api/upload chargée ✅");

app.use((req, res) => {
    console.warn(`⚠️  Route inconnue demandée : ${req.originalUrl}`);
    res.status(404).json({ error: "Route non trouvée" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app;
