const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const { pool } = require("./db");

const router = express.Router();
const upload = multer(); // Utilisation en mémoire, pas de stockage sur le disque

// Route pour l'importation de fichiers CSV
router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("Aucun fichier n'a été téléchargé.");
    }

    const results = [];
    const buffer = req.file.buffer.toString("utf8"); // Convertir le fichier en texte

    const lines = buffer.split("\n");
    const headers = lines[0].split(",");

    // Lire les données et les stocker dans un tableau
    lines.slice(1).forEach(line => {
        const values = line.split(",");
        if (values.length === headers.length) {
            let row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : null;
            });
            results.push(row);
        }
    });

    try {
        for (let row of results) {
            await pool.query(
                `INSERT INTO trainings (date, echauffement, type, duration, intensity, details)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (date) DO UPDATE 
                 SET echauffement = EXCLUDED.echauffement,
                     type = EXCLUDED.type, 
                     duration = EXCLUDED.duration, 
                     intensity = EXCLUDED.intensity, 
                     details = EXCLUDED.details`,
                [row.date, row.echauffement, row.type, row.duration, row.intensity, row.details]
            );
        }
        res.send("✅ Fichier importé avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors de l'insertion des données :", error);
        res.status(500).send("Erreur lors de l'importation.");
    }
});

module.exports = router;
