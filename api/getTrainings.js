const express = require("express");
const router = express.Router();
const pool = require("./db");

router.get("/getTrainings", async (req, res) => {
    try {
        const { date, year, month } = req.query;

        console.log("📌 Paramètres reçus :", req.query); // ✅ DEBUG en logs

        if (date) {
            console.log("📌 Requête SQL : SELECT * FROM trainings WHERE date =", date);
            const result = await pool.query("SELECT * FROM trainings WHERE date = $1", [date]);
            return res.json(result.rows);
        } 
        else if (year && month) {
            console.log("📌 Requête SQL : SELECT * FROM trainings WHERE YEAR =", year, "MONTH =", month);
            const result = await pool.query(
                "SELECT * FROM trainings WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2",
                [parseInt(year), parseInt(month)]
            );
            return res.json(result.rows);
        } 
        else {
            console.warn("⚠️ Requête invalide :", req.query);
            return res.status(400).json({ error: "Paramètres invalides. Utilisez ?date=YYYY-MM-DD ou ?year=YYYY&month=MM" });
        }
    } catch (error) {
        console.error("❌ Erreur SQL ou serveur :", error);
        return res.status(500).json({ error: "Erreur serveur lors de la récupération des entraînements" });
    }
});

module.exports = router;
