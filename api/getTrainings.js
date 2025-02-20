const express = require("express");
const router = express.Router();
const { pool } = require("./db");

router.get("/", async (req, res) => {
    try {
        const { date } = req.query;

        console.log("Récupération des entraînements pour la date :", date);

        if (!date) {
            return res.status(400).json({ error: "❌ La date est requise" });
        }

        const result = await pool.query(
            "SELECT * FROM trainings WHERE DATE(date) = $1",
            [date]
        );

        console.log("✅ Données récupérées :", JSON.stringify(result.rows, null, 2));

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
