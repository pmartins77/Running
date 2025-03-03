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
