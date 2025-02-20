const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/getTrainings', async (req, res) => {
    try {
        const { date } = req.query;
        console.log(`Récupération des entraînements pour la date : ${date}`);

        const result = await pool.query(
            "SELECT * FROM trainings WHERE date::date = $1",
            [date]
        );

        console.log("Données récupérées :", result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
