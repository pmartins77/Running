const express = require('express');
const router = express.Router();
const { pool } = require('./db');

router.get("/", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: "Paramètre 'date' manquant." });
        }

        console.log(`Récupération des entraînements pour la date : ${date}`);

        const result = await pool.query(
            "SELECT * FROM trainings WHERE date::date = $1",
            [date]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Aucun entraînement trouvé." });
        }

        res.json(result.rows);

    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
