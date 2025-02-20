const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { pool } = require("./db");

const router = express.Router();

// Configuration de Multer pour gérer le téléchargement de fichiers
const upload = multer({ dest: "uploads/" });

// Route pour l'importation de fichiers CSV
router.post("/", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("Aucun fichier n'a été téléchargé.");
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            try {
                for (let row of results) {
                    await pool.query(
                        `INSERT INTO trainings (date, echauffement, type, duration, intensity, details)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [row.date, row.echauffement, row.type, row.duration, row.intensity, row.details]
                    );
                }
                fs.unlinkSync(filePath); // Supprime le fichier après traitement
                res.send("Fichier importé avec succès !");
            } catch (error) {
                console.error("Erreur lors de l'insertion des données :", error);
                res.status(500).send("Erreur lors de l'importation.");
            }
        });
});

module.exports = router;
