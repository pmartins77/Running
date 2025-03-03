const express = require("express");
const router = express.Router();
const db = require("./db");
const authMiddleware = require("./authMiddleware");

router.post("/generate", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

        const { 
            objectif, objectifAutre, intensite, terrain, dateEvent, 
            nbSeances, joursSelectionnes, sortieLongue, objectifsIntermediaires 
        } = req.body;

        if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances || joursSelectionnes.length === 0 || !sortieLongue) {
            return res.status(400).json({ error: "Tous les champs sont requis." });
        }

        // 🔹 Insérer l'objectif principal avec tous ses champs
        const objectifPrincipal = await db.query(
            `INSERT INTO objectifs (user_id, type, date, terrain, intensite, nb_seances, jours_selectionnes, sortie_longue, principal) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) RETURNING id`,
            [userId, objectifAutre || objectif, dateEvent, terrain, intensite, nbSeances, JSON.stringify(joursSelectionnes), sortieLongue]
        );

        const objectifPrincipalId = objectifPrincipal.rows[0].id;

        // 🔹 Insérer les objectifs intermédiaires avec les mêmes champs
        let objectifsIds = { [dateEvent]: objectifPrincipalId };
        for (let obj of objectifsIntermediaires) {
            const objInsert = await db.query(
                `INSERT INTO objectifs (user_id, type, date, terrain, intensite, nb_seances, jours_selectionnes, sortie_longue, principal) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE) RETURNING id`,
                [userId, obj.type, obj.date, terrain, intensite, nbSeances, JSON.stringify(joursSelectionnes), sortieLongue]
            );
            objectifsIds[obj.date] = objInsert.rows[0].id;
        }

        // 🔹 Suppression des anciens entraînements générés
        await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

        // 📆 Générer le plan d'entraînement jusqu'à l'objectif principal
        const startDate = new Date();
        const endDate = new Date(dateEvent);
        const trainingPlan = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split("T")[0];
            const dayOfWeek = currentDate.toLocaleDateString("fr-FR", { weekday: "long" });

            if (joursSelectionnes.includes(dayOfWeek)) {
                let objectifId = objectifsIds[dateStr] || objectifPrincipalId;
                let isRaceDay = objectifsIds[dateStr] ? true : false;

                trainingPlan.push({
                    user_id: userId,
                    date: dateStr,
                    type: isRaceDay ? "Course" : "Entraînement",
                    duration: isRaceDay ? "Compétition" : 60,
                    intensity: isRaceDay ? "Haute" : "Modérée",
                    echauffement: isRaceDay ? "Préparez-vous pour la course !" : "15 min footing en zone 2",
                    recuperation: isRaceDay ? "Repos complet" : "10 min footing en zone 1",
                    fc_cible: "140 - 160 BPM",
                    zone_fc: isRaceDay ? "Compétition" : "Zone 3 - Endurance",
                    details: isRaceDay ? `Jour de course : ${objectifId === objectifPrincipalId ? "Objectif principal" : "Objectif intermédiaire"}` : "Séance automatique",
                    is_generated: true,
                    objectif_id: objectifId
                });
            }

            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 🔹 Insérer les nouveaux entraînements en base
        for (const session of trainingPlan) {
            await db.query(
                `INSERT INTO trainings 
                (user_id, date, type, duration, intensity, echauffement, recuperation, fc_cible, zone_fc, details, is_generated, objectif_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    session.user_id, session.date, session.type, session.duration,
                    session.intensity, session.echauffement, session.recuperation,
                    session.fc_cible, session.zone_fc, session.details,
                    session.is_generated, session.objectif_id
                ]
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
