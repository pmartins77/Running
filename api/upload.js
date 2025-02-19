const { pool } = require('./db');
const multer = require('multer');
const csv = require('csv-parser');

const upload = multer().single('file');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de l'upload du fichier" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier reçu" });
        }

        const results = [];
        const buffer = req.file.buffer.toString('utf-8');
        const rows = buffer.split('\n');

        for (let row of rows) {
            const [date, type, echauffement, entrainement, recuperation, conseils] = row.split(',');

            if (!date || !type) continue; // Ignore les lignes incomplètes

            results.push({ date, type, echauffement, entrainement, recuperation, conseils });
        }

        try {
            for (let training of results) {
                await pool.query(
                    `INSERT INTO trainings (date, type, echauffement, entrainement, recuperation, conseils) 
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (date) DO UPDATE SET 
                     type = EXCLUDED.type, echauffement = EXCLUDED.echauffement, 
                     entrainement = EXCLUDED.entrainement, recuperation = EXCLUDED.recuperation, 
                     conseils = EXCLUDED.conseils`,
                    [training.date, training.type, training.echauffement, training.entrainement, training.recuperation, training.conseils]
                );
            }
            res.json({ message: "Fichier importé avec succès !" });
        } catch (error) {
            console.error("Erreur lors de l'insertion des données :", error);
            res.status(500).json({ message: "Erreur lors de l'importation" });
        }
    });
};
