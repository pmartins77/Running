// /api/upload.js (Import CSV en mémoire vers DB)
const express = require("express");
const multer = require("multer");
const { pool } = require("./db");

const router = express.Router();
const upload = multer();

router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).send("Aucun fichier envoyé.");
    
    const lines = req.file.buffer.toString("utf8").split("\n");
    const headers = lines[0].split(",");
    const data = lines.slice(1).map(line => line.split(","));

    try {
        for (let row of data) {
            await pool.query(
                "INSERT INTO trainings (date, echauffement, type, duration, intensity, details) VALUES ($1, $2, $3, $4, $5, $6)",
                row
            );
        }
        res.send("Importation réussie !");
    } catch (error) {
        console.error("Erreur importation CSV :", error);
        res.status(500).send("Erreur lors de l'importation");
    }
});

module.exports = router;
