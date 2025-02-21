const express = require("express");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

router.post("/", async (req, res) => {
    try {
        const trainings = req.body; // JSON reçu du frontend

        if (!Array.isArray(trainings) || trainings.length === 0) {
            return res.status(400).send("Données invalides.");
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
                `INSERT INTO trainings (date, echauffement, type, duration, intensity, details) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [training.date, training.echauffement, training.type, training.duration, training.intensity, training.details]
            );
        }

        client.release();
        res.send("✅ Importation réussie !");
    } catch (error) {
        console.error("❌ Erreur importation CSV :", error);
        res.status(500).send("Erreur lors de l'importation.");
    }
});

module.exports = router;
