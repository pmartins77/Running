const express = require("express");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

router.post("/", async (req, res) => {
    try {
        const trainings = req.body;

        if (!Array.isArray(trainings) || trainings.length === 0) {
            return res.status(400).send("Données invalides.");
        }

        const client = await pool.connect();

        for (const training of trainings) {
            const { date, echauffement, type, duration, intensity, details } = training;

            await client.query(
                `INSERT INTO trainings (date, echauffement, type, duration, intensity, details) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [date, echauffement, type, duration, intensity, details]
            );
        }

        client.release();
        res.send("✅ Importation réussie !");
    } catch (error) {
        console.error("❌ Erreur importation JSON :", error);
        res.status(500).send("Erreur lors de l'importation.");
    }
});

module.exports = router;
