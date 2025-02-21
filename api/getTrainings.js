const express = require("express");
const router = express.Router();
const pool = require("./db"); // ✅ Correction : Import correct de `pool`

router.get("/getTrainings", async (req, res) => {
    try {
        const { date, year, month } = req.query;

        let query;
        let values;

        if (date) {
            query = "SELECT * FROM trainings WHERE date = $1";
            values = [date];
        } else if (year && month) {
            query = "SELECT * FROM trainings WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2";
            values = [year, month];
        } else {
            return res.status(400).json({ error: "Paramètres invalides" });
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Erreur récupération entraînements :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements" });
    }
});

module.exports = router;
