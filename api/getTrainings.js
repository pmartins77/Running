const express = require("express");
const router = express.Router();
const { pool } = require("./db");

router.get("/", async (req, res) => {
    try {
        const { date, year, month } = req.query;

        if (date) {
            console.log(`📌 Requête SQL : SELECT * FROM trainings WHERE date = '${date}'`);
            const result = await pool.query("SELECT * FROM trainings WHERE date = $1", [date]);
            return res.json(result.rows);
        } 
        
        if (year && month) {
            console.log(`📌 Requête SQL : SELECT * FROM trainings WHERE YEAR = ${year} AND MONTH = ${month}`);
            const result = await pool.query(
                "SELECT * FROM trainings WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2",
                [parseInt(year), parseInt(month)]
            );
            return res.json(result.rows);
        }

        return res.status(400).json({ error: "Paramètres invalides. Utilisez ?date=YYYY-MM-DD ou ?year=YYYY&month=MM" });

    } catch (error) {
        console.error("❌ Erreur récupération entraînements :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
