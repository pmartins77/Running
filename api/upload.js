const express = require("express");
const pool = require("./db");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const trainings = req.body;
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        if (!Array.isArray(trainings) || trainings.length === 0) {
            return res.status(400).json({ error: "Données invalides." });
        }

        const client = await pool.connect();

        for (const training of trainings) {
            await client.query(
                `INSERT INTO trainings (date, echauffement, type, duration, intensity, details, user_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [training.date, training.echauffement, training.type, training.duration, training.intensity, training.details, userId]
            );
        }

        client.release();
        res.status(200).json({ message: "✅ Importation réussie !" });

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'importation." });
    }
});

module.exports = router;
