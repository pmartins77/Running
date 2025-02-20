const express = require("express");
const router = express.Router();
const { pool } = require("./db");

router.get("/", async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "La date est requise" });
        }

        console.log("Recherche des entraînements pour :", date);

        // Vérification que la connexion PostgreSQL est active
        if (!pool) {
            console.error("Connexion PostgreSQL non disponible.");
            return res.status(500).json({ error: "Problème de connexion à la base de données" });
        }

        // Exécuter la requête SQL
        const result = await pool.query(
            "SELECT * FROM trainings WHERE DATE(date) = $1",
            [date]
        );

        console.log("Données trouvées :", JSON.stringify(result.rows, null, 2));

        res.json(result.rows);
    } catch (error) {
        console.error("Erreur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router; 
