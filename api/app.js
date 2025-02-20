const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

// Importation des routes API
const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload"); // <-- Ajout de la route d'import CSV

// Initialisation de l'application Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Définition des routes API
app.use("/api/getTrainings", getTrainings);
app.use("/api/deleteAll", deleteAll);
app.use("/api/upload", upload);  // <-- Route pour l'import CSV

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Serveur API démarré sur le port ${PORT}`);
});
