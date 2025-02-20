const { Pool } = require('pg');

// Initialisation de la connexion à la base de données
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") ? { rejectUnauthorized: false } : false
});

// Vérification de la connexion à PostgreSQL
pool.connect()
    .then(() => console.log("✅ Connexion à PostgreSQL réussie !"))
    .catch(err => console.error("❌ Erreur de connexion à PostgreSQL :", err));

// Fonction pour insérer un entraînement
const insertTraining = async (date, echauffement, type, duration, intensity, details) => {
    try {
        await pool.query(
            `INSERT INTO trainings (date, echauffement, type, duration, intensity, details)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (date) 
             DO UPDATE SET 
                 echauffement = EXCLUDED.echauffement,
                 type = EXCLUDED.type, 
                 duration = EXCLUDED.duration, 
                 intensity = EXCLUDED.intensity, 
                 details = EXCLUDED.details`,
            [date, echauffement, type, duration, intensity, details]
        );
        console.log(`✅ Entraînement ajouté/modifié pour la date : ${date}`);
    } catch (err) {
        console.error("❌ Erreur lors de l'insertion des données :", err);
    }
};

// Fonction pour récupérer les entraînements d'une date spécifique
const getTrainingsByDate = async (date) => {
    try {
        const result = await pool.query(
            `SELECT * FROM trainings WHERE DATE(date) = $1`,
            [date]
        );
        console.log(`✅ Récupération des entraînements pour la date : ${date}`);
        return result.rows;
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des données :", err);
        return [];
    }
};

// Fonction pour supprimer un entraînement d'une date spécifique
const deleteTrainingByDate = async (date) => {
    try {
        await pool.query('DELETE FROM trainings WHERE DATE(date) = $1', [date]);
        console.log(`✅ Entraînement supprimé pour la date : ${date}`);
    } catch (err) {
        console.error("❌ Erreur lors de la suppression des données :", err);
    }
};

// Fonction pour supprimer tous les entraînements
const deleteAllTrainings = async () => {
    try {
        await pool.query('DELETE FROM trainings');
        console.log("✅ Tous les entraînements ont été supprimés !");
    } catch (err) {
        console.error("❌ Erreur lors de la suppression de toutes les données :", err);
    }
};

module.exports = { 
    pool, 
    insertTraining, 
    getTrainingsByDate, 
    deleteTrainingByDate, 
    deleteAllTrainings 
};
