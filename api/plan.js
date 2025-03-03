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

        if (!dateEvent) {
            console.error("❌ ERREUR : `dateEvent` est manquant !");
            return res.status(400).json({ error: "La date de l'événement est requise." });
        }

        // 🔹 Insérer l'objectif principal dans la base
        console.log("📌 Insertion de l'objectif principal...");

        const objectifPrincipal = await db.query(
            `INSERT INTO objectifs (user_id, type, date_event, terrain, intensite, nb_seances, sortie_longue, jours_seances, est_principal) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) RETURNING id`,
            [userId, objectifAutre || objectif, dateEvent, terrain, intensite, nbSeances, sortieLongue, `{${joursSelectionnes.join(",")}}`]
        );

        const objectifPrincipalId = objectifPrincipal.rows[0].id;
        console.log("✅ Objectif principal inséré avec ID :", objectifPrincipalId);

        // 🔹 Insérer les objectifs intermédiaires
        let objectifsIds = { [dateEvent]: objectifPrincipalId };
        for (let obj of objectifsIntermediaires) {
            if (!obj.type || !obj.date) {
                console.warn("⚠️ Objectif intermédiaire ignoré (type ou date manquant)", obj);
                continue;
            }

            const objInsert = await db.query(
                `INSERT INTO objectifs (user_id, type, date_event, terrain, intensite, nb_seances, sortie_longue, jours_seances, est_principal) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE) RETURNING id`,
                [userId, obj.type, obj.date, terrain, intensite, nbSeances, sortieLongue, `{${joursSelectionnes.join(",")}}`]
            );
            objectifsIds[obj.date] = objInsert.rows[0].id;
            console.log(`✅ Objectif intermédiaire ajouté (${obj.type}) avec ID :`, objInsert.rows[0].id);
        }

        // 🔹 Vérification des objectifs avant de générer le plan
        console.log("📌 Objectifs disponibles avant la génération :", objectifsIds);

        // 🔹 Génération du plan d'entraînement
        console.log("📌 Appel à generateTrainingPlan avec les nouveaux objectifs...");
        const plan = await generateTrainingPlan(userId, objectifsIds, joursSelectionnes, sortieLongue, dateEvent);

        console.log(`✅ Plan généré avec succès :`, plan);
        res.json({ success: true, plan });

    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
