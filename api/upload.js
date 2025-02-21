const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// ✅ Middleware pour vérifier l'authentification
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Non autorisé." });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token invalide." });
        }
        req.userId = user.userId;
        next();
    });
}

// ✅ Route pour importer un fichier CSV (chaque entraînement est lié à l'utilisateur connecté)
router.post("/", authenticateToken, async (req, res) => {
    try {
        const trainings = req.body;
        const userId = req.userId; // Récupérer l'utilisateur connecté

        if (!Array.isArray(trainings) || trainings.length === 0) {
            return res.status(400).json({ error: "Données invalides." });
        }

        const client = await pool.connect();

        for (const training of trainings) {
            console.log("📌 Données reçues pour insertion :", training); // DEBUG

            // Vérification du nombre de colonnes
            if (!training.date || !training.echauffement || !training.type || !training.duration || !training.intensity || !training.details) {
                console.warn("❌ Ligne ignorée (colonnes manquantes) :", training);
                continue;
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
