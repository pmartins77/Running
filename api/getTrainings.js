// /api/getTrainings.js (Lecture des entraînements)
const express = require("express");
const router = express.Router();
const { pool } = require("./db");

router.get("/", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Date requise" });

        const result = await pool.query("SELECT * FROM trainings WHERE date = $1", [date]);
        res.json(result.rows);
    } catch (error) {
        console.error("Erreur récupération entraînements :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
