const express = require("express");
const router = express.Router();
const generateTrainingPlanAI = require("./aiPlan"); // 🔄 Appel à l'IA
const authMiddleware = require("./authMiddleware");
const db = require("./db");

router.post("/generate", authMiddleware, async (req, res) => {
    try {
        console.log("🔍 Vérification `req.userId` dans plan.js :", req.userId);
        const userId = req.userId;
        if (!userId) {
            console.error("❌ Erreur : `req.userId` est undefined !");
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

        const {
            objectif,
            intensite,
            terrain,
            dateEvent,
            nbSeances,
            joursSelectionnes,
            sortieLongue,
            vma,
            fcMax,
            allures,
            blessures,
            autresSports,
            contraintes,
            nutrition,
            recuperation
        } = req.body;

        console.log("📌 Données reçues :", req.body);

        // Vérification des champs obligatoires
        if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances || joursSelectionnes.length === 0) {
            console.error("❌ Erreur : Champs obligatoires manquants !");
            return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires." });
        }

        // Vérifier que sortieLongue est bien renseigné
        if (!sortieLongue) {
            console.warn("⚠️ Avertissement : Aucun jour de sortie longue spécifié !");
        }

        // 🔹 Insérer l'objectif principal
        console.log("📌 Insertion de l'objectif principal...");
        const objectifPrincipal = await db.query(
            `INSERT INTO objectifs 
             (user_id, type, date_event, terrain, intensite, nb_seances, sortie_longue, jours_seances, vma_estimee, fc_max_estimee, allures_reference, blessures, autres_sports, contraintes, nutrition, recuperation, est_principal) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE) RETURNING id`,
            [userId, objectif, dateEvent, terrain, intensite, nbSeances, sortieLongue, joursSelectionnes, vma, fcMax, allures, blessures, autresSports, contraintes, nutrition, recuperation]
        );

        const objectifPrincipalId = objectifPrincipal.rows[0].id;
        console.log("✅ Objectif principal inséré avec ID :", objectifPrincipalId);

        // 🔹 Génération du plan d'entraînement avec IA
        console.log("📌 Appel à generateTrainingPlanAI...");
        const plan = await generateTrainingPlanAI({
            objectif,
            dateEvent,
            terrain,
            intensite,
            nbSeances,
            joursSelectionnes,
            sortieLongue,
            vma,
            fcMax,
            allures,
            blessures,
            autresSports,
            contraintes,
            nutrition,
            recuperation
        });

        // Vérification du plan généré
        if (!plan || plan.length === 0) {
            console.error("❌ Aucune séance générée !");
            return res.status(400).json({ error: "Le plan d'entraînement n'a pas pu être généré." });
        }

        console.log(`✅ Plan généré avec succès ! Nombre de séances : ${plan.length}`);

        // 🔹 Insérer le plan généré dans la base de données
        console.log("📌 Enregistrement du plan d'entraînement en base...");
        for (const session of plan) {
            await db.query(
                `INSERT INTO trainings 
                 (user_id, objectif_id, date, duration, type, intensity, echauffement, recuperation, fc_cible, details, planifie_par_ai) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
                [userId, objectifPrincipalId, session.date, session.duree, session.type, session.intensite, session.echauffement, session.recuperation, session.fc_cible, session.details]
            );
        }

        console.log("✅ Plan enregistré en base !");
        res.json({ success: true, plan });

    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
