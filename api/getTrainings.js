const express = require("express");
const router = express.Router();
const { pool } = require("./db");
const authMiddleware = require("./authMiddleware"); // ✅ Import du middleware

router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("📌 User ID reçu via JWT :", req.userId); // ✅ Debug
        const { date, year, month } = req.query;

        if (date) {
            console.log(`📌 Requête SQL : SELECT * FROM trainings WHERE date = '${date}' AND user_id = ${req.userId}`);
            const result = await pool.query(
                "SELECT * FROM trainings WHERE date = $1 AND user_id = $2", 
                [date, req.userId] // ✅ Filtrer par user_id
            );
            return res.json(result.rows);
        } 
        
        if (year && month) {
            console.log(`📌 Requête SQL : SELECT * FROM trainings WHERE YEAR = ${year} AND MONTH = ${month} AND user_id = ${req.userId}`);
            const result = await pool.query(
                "SELECT * FROM trainings WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 AND user_id = $3",
                [parseInt(year), parseInt(month), req.userId] // ✅ Filtrer par user_id
            );
            return res.json(result.rows);
        }

        return res.status(400).json({ error: "Paramètres invalides. Utilisez ?date=YYYY-MM-DD ou ?year=YYYY&month=MM" });

    } catch (error) {
        console.error("❌ Erreur récupération entraînements :", error);
        return res.status(500).json({ error: "Erreur serveur", details: error.message });
    }
});

module.exports = router;
