const express = require("express");
const cors = require("cors");
require("dotenv").config();
const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");
const authRoutes = require("./auth"); // ✅ Import du fichier auth.js

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Ajout des logs pour vérifier le chargement des routes
console.log("📌 Démarrage du serveur...");
console.log("📌 Configuration des routes API :");

// ✅ Ajout de la route d'authentification
app.use("/api/auth", authRoutes);
console.log("  - Route /api/auth chargée ✅");

// ✅ Autres routes API
app.use("/api/getTrainings", getTrainings);
console.log("  - Route /api/getTrainings chargée ✅");

app.use("/api/deleteAll", deleteAll);
console.log("  - Route /api/deleteAll chargée ✅");

app.use("/api/upload", upload);
console.log("  - Route /api/upload chargée ✅");

// ✅ Gestion des routes non trouvées (DEBUG)
app.use((req, res, next) => {
    console.warn(`⚠️  Route inconnue demandée : ${req.originalUrl}`);
    res.status(404).json({ error: "Route non trouvée" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app;
