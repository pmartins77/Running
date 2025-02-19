const express = require('express');
const router = express.Router();
const pool = require('./db');

router.post('/upload', async (req, res) => {
    try {
        console.log("Fichier reçu, début du traitement...");

        if (!req.body.trainings) {
            console.error("Erreur : Aucun trainings trouvé dans le corps de la requête.");
            return res.status(400).json({ error: "Aucun entraînement fourni." });
        }

        const trainings = req.body.trainings;
        console.log("Données reçues :", trainings);

        for (const training of trainings) {
            await pool.query(
                "INSERT INTO trainings (date, echauffement, type, duration, intensity, details) VALUES ($1, $2, $3, $4, $5, $6)",
                [training.date, training.echauffement, training.type, training.duration, training.intensity, training.details]
            );
        }

        console.log("Importation réussie !");
        res.json({ message: "Importation réussie" });

    } catch (error) {
        console.error("Erreur lors de l'insertion des données :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
