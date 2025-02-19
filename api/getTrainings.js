const { pool } = require('./db');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { date } = req.query;

    try {
        const { rows } = await pool.query("SELECT * FROM trainings WHERE date = $1", [date]);

        if (rows.length === 0) {
            return res.json({ message: "Aucun entraînement prévu" });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        res.status(500).json({ message: "Erreur de récupération des données" });
    }
};
