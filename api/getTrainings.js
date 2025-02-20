const express = require("express");
const router = express.Router();
const pool = require("./db");

router.get("/", async (req, res) => {
    try {
        const { date } = req.query;

        console.log("Récupération des entraînements pour la date :", date);

        // Vérifier que la date est fournie
        if (!date) {
            console.error("Erreur : La date est manquante dans la requête.");
            return res.status(400).json({ error: "La date est requise" });
        }

        // Vérifier que la connexion à la base de données fonctionne
        if (!pool) {
            console.error("Erreur : Connexion à la base de données non disponible.");
            return res.status(500).json({ error: "Problème de connexion à la base de données" });
        }

        // Exécuter la requête SQL
        const result = await pool.query(
            "SELECT * FROM trainings WHERE date = $1::date",
            [date]
        );

        console.log("Données récupérées :", JSON.stringify(result.rows, null, 2));

        // Envoyer la réponse JSON
        res.json(result.rows);
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
