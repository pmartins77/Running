const express = require("express");
const router = express.Router();
const pool = require("./db"); // On récupère le pool correctement

router.post("/upload", async (req, res) => {
    try {
        if (!req.body || !Array.isArray(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: "Aucune donnée reçue." });
        }

        console.log("📌 Données reçues pour importation :", req.body);

        // ✅ Utilisation d'une seule connexion pour insérer toutes les données
        const client = await pool.connect();

        try {
            await client.query("BEGIN"); // ✅ Démarrer une transaction pour éviter les erreurs partielles

            for (const row of req.body) {
                await client.query(
                    `INSERT INTO trainings (date, echauffement, type, duration, intensity, details) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [row.date, row.echauffement, row.type, row.duration, row.intensity, row.details]
                );
            }

            await client.query("COMMIT"); // ✅ Validation de la transaction si tout va bien
            console.log("✅ Importation réussie !");
            res.status(200).json({ message: "Importation réussie !" });

        } catch (err) {
            await client.query("ROLLBACK"); // ❌ Annulation si une erreur se produit
            console.error("❌ Erreur lors de l'importation :", err);
            res.status(500).json({ error: "Erreur serveur lors de l'importation." });

        } finally {
            client.release(); // ✅ Libération propre de la connexion
        }

    } catch (error) {
        console.error("❌ Erreur générale d'importation :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'importation." });
    }
});

module.exports = router;
