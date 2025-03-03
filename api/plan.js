const express = require("express");
const router = express.Router();
const generateTrainingPlan = require("./planGenerator");
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
            objectifAutre,
            intensite,
            terrain,
            dateEvent,
            nbSeances,
            joursSelectionnes,
            sortieLongue,
            objectifsIntermediaires
        } = req.body;

        console.log("📌 Données reçues :", req.body);

        // 🔹 Insérer l'objectif principal dans la base
        console.log("📌 Insertion de l'objectif principal...");

        const objectifPrincipal = await db.query(
            `INSERT INTO objectifs (user_id, type, date_event, terrain, intensite, nb_seances, sortie_longue, jours_seances, est_principal) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) RETURNING id, date_event`,
            [userId, objectifAutre || objectif, dateEvent, terrain, intensite, nbSeances, sortieLongue, joursSelectionnes]
        );

        const objectifPrincipalId = objectifPrincipal.rows[0].id;
        const objectifPrincipalDate = objectifPrincipal.rows[0].date_event;

        console.log("✅ Objectif principal inséré avec ID :", objectifPrincipalId, "Date :", objectifPrincipalDate);

        // 🔹 Insérer les objectifs intermédiaires
        let objectifsIds = { [objectifPrincipalDate]: objectifPrincipalId };
        for (let obj of objectifsIntermediaires) {
            const objInsert = await db.query(
                `INSERT INTO objectifs (user_id, type, date_event, terrain, intensite, nb_seances, sortie_longue, jours_seances, est_principal) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE) RETURNING id, date_event`,
                [userId, obj.type, obj.date, terrain, intensite, nbSeances, sortieLongue, joursSelectionnes]
            );
            objectifsIds[objInsert.rows[0].date_event] = objInsert.rows[0].id;
            console.log(`✅ Objectif intermédiaire ajouté (${obj.type}) avec ID :`, objInsert.rows[0].id, "Date :", objInsert.rows[0].date_event);
        }

        // 🔹 Génération du plan d'entraînement
        console.log("📌 Appel à generateTrainingPlan avec les nouveaux objectifs...");
        const plan = await generateTrainingPlan(userId, objectifsIds, joursSelectionnes, sortieLongue);

        console.log(`✅ Plan généré avec succès :`, plan);
        res.json({ success: true, plan });

    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
