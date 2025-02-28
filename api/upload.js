const express = require("express");
const pool = require("./db");
const jwt = require("jsonwebtoken");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// ✅ Middleware d’authentification
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("❌ AuthMiddleware : Token manquant ou mal formaté.");
        return res.status(401).json({ error: "Accès interdit. Token manquant ou mal formaté." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.userId;
        console.log("✅ Token valide, utilisateur ID :", req.userId);
        next();
    } catch (error) {
        console.error("❌ AuthMiddleware : Erreur de vérification du token :", error.message);
        return res.status(403).json({ error: "Token invalide." });
    }
}

// ✅ Fonction pour valider les dates (évite le 29 février sur une année non bissextile)
function isValidDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false; // Vérifie si la date est invalide

    // Vérifie si la date fournie correspond bien après conversion
    const [year, month, day] = dateString.split("-").map(Number);
    return (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
    );
}

// ✅ Route pour importer un fichier CSV (chaque entraînement est lié à l'utilisateur connecté)
router.post("/", authenticateToken, async (req, res) => {
    try {
        const trainings = req.body;
        const userId = req.userId;

        if (!Array.isArray(trainings) || trainings.length === 0) {
            return res.status(400).json({ error: "Données invalides ou fichier vide." });
        }

        const client = await pool.connect();

        for (const training of trainings) {
            console.log("📌 Données reçues pour insertion :", training);

            // Vérification du format des données
            if (!training.date || !training.echauffement || !training.type || !training.duration || !training.intensity || !training.details) {
                console.warn("❌ Ligne ignorée (colonnes manquantes) :", training);
                continue;
            }

            // Vérification de la validité de la date
            if (!isValidDate(training.date)) {
                console.warn("❌ Date invalide détectée :", training.date);
                return res.status(400).json({ error: `La date ${training.date} est invalide.` });
            }

            await client.query(
                `INSERT INTO trainings (date, echauffement, type, duration, intensity, details, user_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [training.date, training.echauffement, training.type, training.duration, training.intensity, training.details, userId]
            );
        }

        client.release();
        res.status(200).json({ message: "✅ Importation réussie !" });

    } catch (error) {
        console.error("❌ Erreur importation CSV :", error);
        res.status(500).json({ error: "Erreur lors de l'importation." });
    }
});

module.exports = router;
