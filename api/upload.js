const express = require("express");
const csv = require("csv-parser");
const { pool } = require("./db");

const router = express.Router();

// Route pour l'importation des données CSV envoyées en JSON
router.post("/", async (req, res) => {
    try {
        const trainings = req.body;

        if (!Array.isArray(trainings) || trainings.length === 0) {
            return res.status(400).json({ error: "Données CSV invalides ou vides." });
        }

        for (let row of trainings) {
            await pool.query(
                `INSERT INTO trainings (date, echauffement, type, duration, intensity, details)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [row.date, row.echauffement, row.type, row.duration, row.intensity, row.details]
            );
        }

        res.json({ message: "Données importées avec succès !" });

    } catch (error) {
        console.error("Erreur lors de l'insertion des données :", error);
        res.status(500).json({ error: "Erreur lors de l'importation." });
    }
});

module.exports = router;
