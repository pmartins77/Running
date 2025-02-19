const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Fonction pour insérer un entraînement
const insertTraining = async (date, type, duration, intensity, details) => {
    try {
        await pool.query(
            'INSERT INTO trainings (date, type, duration, intensity, details) VALUES ($1, $2, $3, $4, $5)',
            [date, type, duration, intensity, details]
        );
    } catch (err) {
        console.error("Erreur lors de l'insertion des données :", err);
    }
};

// Fonction pour récupérer les entraînements d'une date spécifique
const getTrainingsByDate = async (date) => {
    try {
        const result = await pool.query(
            'SELECT * FROM trainings WHERE date = $1',
            [date]
        );
        return result.rows;
    } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        return [];
    }
};

// Fonction pour supprimer tous les entraînements
const deleteAllTrainings = async () => {
    try {
        await pool.query('DELETE FROM trainings');
    } catch (err) {
        console.error("Erreur lors de la suppression des données :", err);
    }
};

module.exports = { pool, insertTraining, getTrainingsByDate, deleteAllTrainings };
