const express = require("express");
const router = express.Router();
const generateTrainingPlanAI = require("./aiPlan");
const authMiddleware = require("./authMiddleware");
const db = require("./db");

router.post("/generate", authMiddleware, async (req, res) => {
    try {
        console.log("🔍 Vérification `req.userId` dans plan.js :", req.userId);
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

        const {
            objectif, objectifAutre, intensite, terrain, dateEvent, nbSeances,
            deniveleTotal, joursSelectionnes, sortieLongue, blessures,
            contraintes, alluresReference, vmaEstimee, fcMaxEstimee, 
            autresSports, typesSeances, nutrition, recuperation, objectifsIntermediaires
        } = req.body;

        console.log("📌 Données reçues :", req.body);

        // 🔹 Insertion de l'objectif principal en base
        const objectifPrincipal = await db.query(
            `INSERT INTO objectifs (user_id, type, date_event, terrain, intensite, nb_seances, 
            sortie_longue, jours_seances, denivele_total, est_principal, allures_reference, vma_estimee, 
            fc_max_estimee, autres_sports, contraintes, types_seances, nutrition, recuperation, blessures) 
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
            [userId, objectifAutre || objectif, dateEvent, terrain, intensite, nbSeances,
                sortieLongue, joursSelectionnes, deniveleTotal, alluresReference, vmaEstimee, 
                fcMaxEstimee, autresSports, contraintes, typesSeances, nutrition, recuperation, blessures]
        );

        const objectifPrincipalId = objectifPrincipal.rows[0].id;
        console.log("✅ Objectif principal inséré avec ID :", objectifPrincipalId);

        // 🔹 Génération du plan d'entraînement via IA
        console.log("📌 Appel à l'IA...");
        const plan = await generateTrainingPlanAI({
            objectif, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue,
            deniveleTotal, alluresReference, vmaEstimee, fcMaxEstimee, autresSports,
            contraintes, typesSeances, nutrition, recuperation, blessures, objectifsIntermediaires
        });

        if (plan.length === 0) {
            return res.status(400).json({ error: "Le plan d'entraînement n'a pas pu être généré." });
        }

        // 🔹 Stocker le plan généré dans la base
        console.log("📌 Enregistrement des séances...");
        for (const session of plan) {
            await db.query(
                `INSERT INTO trainings (user_id, date, type, duration, intensity, details, 
                fc_cible, zone_fc, echauffement, recuperation, is_generated, objectif_id, planifie_par_ai) 
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11,TRUE)`,
                [userId, session.date, session.type, session.duree, session.intensite, session.details,
                    session.fc_cible, session.zone_fc, session.echauffement, session.recuperation, objectifPrincipalId]
            );
        }

        console.log("✅ Plan d'entraînement enregistré !");
        res.json({ success: true, plan });

    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
