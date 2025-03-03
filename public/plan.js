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

        const { objectif, objectifAutre, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue, objectifsIntermediaires } = req.body;

        if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances || joursSelectionnes.length === 0 || !sortieLongue) {
            return res.status(400).json({ error: "Tous les champs sont requis." });
        }

        console.log("📌 Objectif principal : ", objectif, dateEvent);
        console.log("📌 Objectifs intermédiaires : ", objectifsIntermediaires);

        // 🔹 Insérer l'objectif principal dans la base
        const objectifPrincipal = await db.query(
            `INSERT INTO objectifs (user_id, type, date, terrain, intensite, principal) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
            [userId, objectifAutre || objectif, dateEvent, terrain, intensite]
        );

        const objectifPrincipalId = objectifPrincipal.rows[0].id;

        // 🔹 Insérer les objectifs intermédiaires
        let objectifsIds = { [dateEvent]: objectifPrincipalId };
        for (let obj of objectifsIntermediaires) {
            const objInsert = await db.query(
                `INSERT INTO objectifs (user_id, type, date, terrain, intensite, principal) VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id`,
                [userId, obj.type, obj.date, terrain, intensite]
            );
            objectifsIds[obj.date] = objInsert.rows[0].id;
        }

        // 🔹 Suppression des anciens entraînements générés
        await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

        // 📆 Générer le plan d'entraînement jusqu'à l'objectif principal
        let startDate = new Date();
        let endDate = new Date(dateEvent);
        let currentDate = new Date(startDate);
        let trainingPlan = [];

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.toLocaleDateString("fr-FR", { weekday: "long" });

            if (joursSelectionnes.includes(dayOfWeek)) {
                let objectifId = objectifsIds[currentDate.toISOString().split("T")[0]] || objectifPrincipalId;
                let isRaceDay = objectifsIds[currentDate.toISOString().split("T")[0]] ? true : false;

                // Définition des entraînements spécifiques
                let typeEntrainement = "Entraînement";
                let details = "Séance automatique";
                let echauffement = "15 min footing en zone 2";
                let recuperation = "10 min footing en zone 1";

                if (isRaceDay) {
                    typeEntrainement = "Course";
                    details = `Jour de course : ${objectifId === objectifPrincipalId ? "Objectif principal" : "Objectif intermédiaire"}`;
                    echauffement = "Préparez-vous pour la course !";
                    recuperation = "Repos complet";
                } else if (dayOfWeek === sortieLongue) {
                    typeEntrainement = "Sortie Longue";
                    details = "Sortie longue en endurance fondamentale";
                }

                trainingPlan.push({
                    user_id: userId,
                    date: currentDate.toISOString().split("T")[0],
                    type: typeEntrainement,
                    duration: isRaceDay ? "Compétition" : 60,
                    intensity: isRaceDay ? "Haute" : "Modérée",
                    echauffement: echauffement,
                    recuperation: recuperation,
                    fc_cible: "140 - 160 BPM",
                    zone_fc: isRaceDay ? "Compétition" : "Zone 3 - Endurance",
                    details: details,
                    is_generated: true,
                    objectif_id: objectifId
                });
            }

            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 🔹 Insérer les nouveaux entraînements dans la base
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
