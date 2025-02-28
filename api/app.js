const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("📌 Démarrage du serveur...");
console.log("📌 Configuration des routes API :");

// ✅ Chargement sécurisé des routes
function safeUseRoute(path, routeModule, routeName) {
    if (routeModule && typeof routeModule === "function") {
        app.use(path, routeModule);
        console.log(`  - Route ${path} chargée ✅`);
    } else {
        console.error(`❌ ERREUR : ${routeName} n'est pas un routeur Express valide !`);
    }
}

// ✅ Import et vérification des routes
safeUseRoute("/api/auth", require("./auth"), "authRoutes");
safeUseRoute("/api/strava", require("./strava"), "stravaRoutes");
safeUseRoute("/api/getTrainings", require("./getTrainings"), "getTrainings");
safeUseRoute("/api/deleteAll", require("./deleteAll"), "deleteAll");
safeUseRoute("/api/upload", require("./upload"), "upload");
safeUseRoute("/api/user", require("./user"), "userRoutes"); // 🆕 Ajout de la route pour la gestion du profil utilisateur

// ✅ Gestion des routes inconnues
app.use((req, res) => {
    console.warn(`⚠️ Route inconnue demandée : ${req.originalUrl}`);
    res.status(404).json({ error: "Route non trouvée" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app;
