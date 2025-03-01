const express = require("express");
const cors = require("cors");
require("dotenv").config();
const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");
const authRoutes = require("./auth");
const stravaRoutes = require("./strava");
const userRoutes = require("./user"); // ✅ Ajout de la gestion du profil utilisateur

const app = express();
app.use(cors());
app.use(express.json());

console.log("📌 Démarrage du serveur...");
console.log("📌 Configuration des routes API :");

// ✅ Authentification
app.use("/api/auth", authRoutes);
console.log("  - Route /api/auth chargée ✅");

// ✅ Intégration Strava
app.use("/api/strava", stravaRoutes);
console.log("  - Route /api/strava chargée ✅");

// ✅ Récupération des entraînements
app.use("/api/getTrainings", getTrainings);
console.log("  - Route /api/getTrainings chargée ✅");

// ✅ Suppression des entraînements
app.use("/api/deleteAll", deleteAll);
console.log("  - Route /api/deleteAll chargée ✅");

// ✅ Importation des entraînements CSV
app.use("/api/upload", upload);
console.log("  - Route /api/upload chargée ✅");

// ✅ Gestion du profil utilisateur
app.use("/api/user", userRoutes);
console.log("  - Route /api/user chargée ✅");

// ✅ Gestion des routes inconnues
app.use((req, res) => {
    console.warn(`⚠️  Route inconnue demandée : ${req.originalUrl}`);
    res.status(404).json({ error: "Route non trouvée" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app;
