const express = require("express");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// ✅ **Récupération des entraînements de l'utilisateur connecté**
router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Requête API getTrainings avec User ID :", req.userId);

        const { date, year, month } = req.query;
        let query;
        let values;

        // ✅ Vérifier que les paramètres sont bien passés
        if (!date && (!year || !month)) {
            return res.status(400).json({ error: "Paramètres 'date' ou 'year' et 'month' requis." });
        }

        // ✅ Récupérer les entraînements par date spécifique
        if (date) {
            query = `SELECT * FROM trainings WHERE date = $1 AND user_id = $2 ORDER BY date ASC`;
            values = [date, req.userId];
        } 
        // ✅ Récupérer les entraînements du mois sélectionné
        else if (year && month) {
            query = `SELECT * FROM trainings WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 AND user_id = $3 ORDER BY date ASC`;
            values = [year, month, req.userId];
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            console.log("📌 Aucun entraînement trouvé pour cet utilisateur.");
            return res.status(200).json([]); // ✅ Retourner un tableau vide au lieu d'une erreur
        }

        console.log("📌 Entraînements trouvés :", result.rows.length);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Erreur serveur lors de la récupération des entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements." });
    }
});

module.exports = router;
