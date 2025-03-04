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
            deniveleTotal,
            joursSelectionnes,
            sortieLongue,
            blessures,
            contraintes
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

        // 🔹 Récupération de la date de naissance pour estimer la VMA
        let vmaEstimee = null;
        try {
            const userQuery = await db.query("SELECT date_de_naissance FROM users WHERE id = $1", [userId]);
            if (userQuery.rows.length > 0) {
                const dateNaissance = userQuery.rows[0].date_de_naissance;
                const age = new Date().getFullYear() - new Date(dateNaissance).getFullYear();
                vmaEstimee = 30 - (age * 0.2); // Formule simplifiée
                console.log(`📌 Estimation de la VMA pour âge ${age} ans : ${vmaEstimee} km/h`);
            }
        } catch (error) {
            console.warn("⚠️ Erreur lors de l'estimation de la VMA :", error.message);
        }

        // 🔹 Insérer l'objectif principal dans la base
        console.log("📌 Insertion de l'objectif principal...");
        const objectifPrincipal = await db.query(
            `INSERT INTO objectifs (user_id, type, date_event, terrain, intensite, nb_seances, sortie_longue, jours_seances, denivele_total, est_principal) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE) RETURNING id`,
            [userId, objectifAutre || objectif, dateEvent, terrain, intensite, nbSeances, sortieLongue, joursSelectionnes, deniveleTotal]
        );

        const objectifPrincipalId = objectifPrincipal.rows[0].id;
        console.log("✅ Objectif principal inséré avec ID :", objectifPrincipalId);

        // 🔹 Génération du plan d'entraînement avec IA
        console.log("📌 Appel à generateTrainingPlan...");
        const plan = await generateTrainingPlan(userId, {
            objectifPrincipalId,
            joursSelectionnes,
            sortieLongue: sortieLongue || joursSelectionnes[0], // Choix par défaut si non défini
            nbSeances,
            deniveleTotal,
            vmaEstimee
        });

        // Vérification du plan généré
        if (plan.length === 0) {
            console.error("❌ Aucune séance générée !");
            return res.status(400).json({ error: "Le plan d'entraînement n'a pas pu être généré." });
        }

        console.log(`✅ Plan généré avec succès ! Nombre de séances : ${plan.length}`);
        res.json({ success: true, plan });

    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
