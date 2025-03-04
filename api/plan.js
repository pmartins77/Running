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

        // 🔹 Génération du plan avec IA
        console.log("📌 Appel à generateTrainingPlanAI...");
        const plan = await generateTrainingPlanAI({
            objectifPrincipalId: null,
            joursSelectionnes,
            sortieLongue: sortieLongue || joursSelectionnes[0],
            nbSeances,
            deniveleTotal,
            vmaEstimee: null
        });

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
