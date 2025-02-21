const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { Pool } = require("pg");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("Aucun fichier envoyé.");
    }

    const filePath = req.file.path;

    try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const lines = fileContent.split("\n").slice(1); // Ignorer l'en-tête

        const client = await pool.connect();

        for (const line of lines) {
            const values = line.split(",");

            if (values.length < 6) continue; // Ignorer les lignes incomplètes

            const [date, echauffement, type, duration, intensity, details] = values.map(v => v.trim());

            await client.query(
                `INSERT INTO trainings (date, echauffement, type, duration, intensity, details) VALUES ($1, $2, $3, $4, $5, $6)`,
                [date, echauffement, type, duration, intensity, details]
            );
        }

        client.release();
        fs.unlinkSync(filePath);
        res.send("✅ Importation réussie !");
    } catch (error) {
        console.error("Erreur importation CSV :", error);
        res.status(500).send("Erreur lors de l'importation.");
    }
});

module.exports = router;
