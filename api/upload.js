import { pool } from './db';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';

// Configuration de multer pour gérer l'upload des fichiers
const upload = multer({ dest: '/tmp/' });

export default function handler(req, res) {
    if (req.method === 'POST') {
        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
            }

            // Vérifier si un fichier a été reçu
            if (!req.file) {
                return res.status(400).json({ error: 'Aucun fichier reçu' });
            }

            const filePath = req.file.path;
            const results = [];

            // Lire et analyser le fichier CSV
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row) => {
                    results.push({
                        date: row.Date, // Format YYYY-MM-DD
                        type: row["Type d'entraînement"],
                        echauffement: row["Échauffement"],
                        entrainement: row["Entraînement"],
                        recuperation: row["Récupération"],
                        conseils: row["Conseils"]
                    });
                })
                .on('end', async () => {
                    try {
                        const client = await pool.connect();

                        // Insérer les données dans PostgreSQL
                        for (const training of results) {
                            await client.query(
                                `INSERT INTO trainings (date, type, echauffement, entrainement, recuperation, conseils)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                ON CONFLICT (date) DO UPDATE SET 
                                    type = EXCLUDED.type,
                                    echauffement = EXCLUDED.echauffement,
                                    entrainement = EXCLUDED.entrainement,
                                    recuperation = EXCLUDED.recuperation,
                                    conseils = EXCLUDED.conseils`,
                                [
                                    training.date,
                                    training.type,
                                    training.echauffement,
                                    training.entrainement,
                                    training.recuperation,
                                    training.conseils
                                ]
                            );
                        }

                        client.release();
                        fs.unlinkSync(filePath); // Supprime le fichier temporaire après traitement

                        return res.status(200).json({ message: 'Fichier importé avec succès !' });
                    } catch (error) {
                        console.error('Erreur lors de l\'insertion des données:', error);
                        return res.status(500).json({ error: 'Erreur lors de l\'importation des données' });
                    }
                });
        });
    } else {
        res.status(405).json({ error: 'Méthode non autorisée' });
    }
}
