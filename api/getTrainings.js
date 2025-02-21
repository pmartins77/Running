const express = require("express");
const router = express.Router();
const { pool } = require("./db");
const authenticateUser = require("./authMiddleware");

router.get("/", authenticateUser, async (req, res) => {
    try {
        const { date, year, month } = req.query;
        const userId = req.userId; // Récupérer l'ID de l'utilisateur depuis le token

        if (date) {
            const result = await pool.query("SELECT * FROM trainings WHERE user_id = $1 AND date = $2", [userId, date]);
            return res.json(result.rows);
        }

        if (year && month) {
            const result = await pool.query(
                "SELECT * FROM trainings WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3",
                [userId, parseInt(year), parseInt(month)]
            );
            return res.json(result.rows);
        }

        return res.status(400).json({ error: "Paramètres invalides." });

    } catch (error) {
        console.error("❌ Erreur récupération entraînements :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
