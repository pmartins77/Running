const express = require("express");
const router = express.Router();
const db = require("./db");
const authMiddleware = require("./authMiddleware");

// ✅ Route pour générer un plan d'entraînement
router.post("/generate", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            console.error("❌ Erreur : `req.userId` est undefined !");
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

        const { objectif, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue, intermediaires } = req.body;

        if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances || joursSelectionnes.length === 0 || !sortieLongue) {
            return res.status(400).json({ error: "Tous les champs sont requis." });
        }

        console.log(`📌 Génération du plan pour l'utilisateur ${userId} avec l'objectif ${objectif}`);

        // ✅ Insérer l'objectif principal
        const objectifResult = await db.query(
            `INSERT INTO objectifs (user_id, type, date_event, terrain, intensite, nb_seances, jours_seances, sortie_longue, est_principal)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) RETURNING id`,
            [userId, objectif, dateEvent, terrain, intensite, nbSeances, joursSelectionnes, sortieLongue]
        );

        const objectifId = objectifResult.rows[0].id;
        console.log(`✅ Objectif principal inséré avec ID ${objectifId}`);

        // ✅ Insérer les objectifs intermédiaires
        let intermediairesIds = [];
        for (let inter of intermediaires) {
            const interResult = await db.query(
                `INSERT INTO objectifs (user_id, type, date_event, terrain, intensite, nb_seances, jours_seances, sortie_longue, est_principal)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE) RETURNING id`,
                [userId, inter.type, inter.date, terrain, intensite, nbSeances, joursSelectionnes, sortieLongue]
            );
            intermediairesIds.push({ id: interResult.rows[0].id, date: inter.date });
        }

        console.log(`✅ Objectifs intermédiaires insérés:`, intermediairesIds);

        // ✅ Générer le plan d'entraînement en fonction des jours disponibles
        let trainingPlan = [];
        let startDate = new Date(); // Commence aujourd'hui
        let endDate = new Date(dateEvent); // Jusqu'à la date de l'objectif
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayName = currentDate.toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();

            // Vérifie si c'est un jour d'entraînement
            if (joursSelectionnes.includes(dayName)) {
                // Vérifie si c'est une date d'objectif intermédiaire
                const intermediaire = intermediairesIds.find(i => new Date(i.date).toDateString() === currentDate.toDateString());
                const objectifAssocie = intermediaire ? intermediaire.id : objectifId;

                trainingPlan.push({
                    user_id: userId,
                    date: new Date(currentDate),
                    type: intermediaire ? intermediaire.type : "Entraînement",
                    duration: intermediaire ? 90 : 60, // Plus long si c'est un objectif intermédiaire
                    intensity: intermediaire ? "Élevée" : "Modérée",
                    echauffement: "15 min footing en zone 2",
                    recuperation: "10 min footing en zone 1",
                    fc_cible: "140 - 160 BPM",
                    zone_fc: "Zone 3 - Endurance",
                    details: intermediaire ? `Préparation pour ${intermediaire.type}` : "Séance de travail automatique",
                    objectif_id: objectifAssocie,
                    is_generated: true
                });
            }

            // Passe au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log(`📌 Suppression des anciens entraînements générés`);
        await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

        console.log(`📌 Insertion des nouveaux entraînements`);
        for (const session of trainingPlan) {
            await db.query(
                `INSERT INTO trainings (user_id, date, type, duration, intensity, echauffement, recuperation, fc_cible, zone_fc, details, objectif_id, is_generated)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)`,
                [session.user_id, session.date, session.type, session.duration, session.intensity, session.echauffement,
                 session.recuperation, session.fc_cible, session.zone_fc, session.details, session.objectif_id]
            );
        }

        console.log("✅ Plan inséré avec succès !");
        res.json({ success: true });

    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
