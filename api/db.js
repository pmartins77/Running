const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Fonction pour insérer un entraînement
const insertTraining = async (date, type, duration, intensity, details) => {
    try {
        await pool.query(
            `INSERT INTO trainings (date, type, duration, intensity, details)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (date) DO UPDATE 
             SET type = EXCLUDED.type, 
                 duration = EXCLUDED.duration, 
                 intensity = EXCLUDED.intensity, 
                 details = EXCLUDED.details`,
            [date, type, duration, intensity, details]
        );
    } catch (err) {
        console.error("Erreur lors de l'insertion des données :", err);
    }
};

// Fonction pour récupérer tous les entraînements
const getAllTrainings = async () => {
    try {
        const result = await pool.query('SELECT * FROM trainings ORDER BY date ASC');
        return result.rows;
    } catch (err) {
        console.error("Erreur lors de la récupération de toutes les données :", err);
        return [];
    }
};

// Fonction pour récupérer les entraînements d'une date spécifique
const getTrainingsByDate = async (date) => {
    try {
        const result = await pool.query(
            `SELECT * FROM trainings WHERE DATE(date) = $1`,
            [date]
        );
        return result.rows;
    } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        return [];
    }
};

// Fonction pour mettre à jour un entraînement
const updateTraining = async (date, type, duration, intensity, details) => {
    try {
        await pool.query(
            `UPDATE trainings 
             SET type = $2, 
                 duration = $3, 
                 intensity = $4, 
                 details = $5
             WHERE DATE(date) = $1`,
            [date, type, duration, intensity, details]
        );
    } catch (err) {
        console.error("Erreur lors de la mise à jour des données :", err);
    }
};

// Fonction pour supprimer un entraînement d'une date spécifique
const deleteTrainingByDate = async (date) => {
    try {
        await pool.query('DELETE FROM trainings WHERE DATE(date) = $1', [date]);
    } catch (err) {
        console.error("Erreur lors de la suppression des données :", err);
    }
};

// Fonction pour supprimer tous les entraînements
const deleteAllTrainings = async () => {
    try {
        await pool.query('DELETE FROM trainings');
    } catch (err) {
        console.error("Erreur lors de la suppression de toutes les données :", err);
    }
};

module.exports = { 
    pool, 
    insertTraining, 
    getAllTrainings, 
    getTrainingsByDate, 
    updateTraining, 
    deleteTrainingByDate, 
    deleteAllTrainings 
};
