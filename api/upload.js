const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const { pool } = require("./db");
const stream = require("stream");

const router = express.Router();

// Configuration de Multer pour stocker le fichier en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route pour l'importation de fichiers CSV
router.post("/", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("Aucun fichier n'a été téléchargé.");
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
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
                res.send("Fichier importé avec succès !");
            } catch (error) {
                console.error("Erreur lors de l'insertion des données :", error);
                res.status(500).send("Erreur lors de l'importation.");
            }
        });
});

module.exports = router;
