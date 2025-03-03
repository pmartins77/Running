const express = require("express");
const cors = require("cors");
require("dotenv").config();
const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");
const authRoutes = require("./auth");
const stravaRoutes = require("./strava");
const userRoutes = require("./user");
const planRoutes = require("./plan"); // ✅ Ajout de la route pour les plans

const app = express();
app.use(cors());
app.use(express.json());

console.log("📌 Démarrage du serveur...");

app.use("/api/auth", authRoutes);
app.use("/api/strava", stravaRoutes);
app.use("/api/getTrainings", getTrainings);
app.use("/api/deleteAll", deleteAll);
app.use("/api/upload", upload);
app.use("/api/user", userRoutes);
app.use("/api/plan", planRoutes); // ✅ Route API ajoutée

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app;
