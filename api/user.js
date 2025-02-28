const express = require("express");
const router = express.Router();
const db = require("./db");
const authMiddleware = require("./authMiddleware");

router.get("/profile", authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.warn("⚠️ Problème d'authentification : `req.user` est undefined");
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

        console.log(`📌 Récupération du profil pour l'utilisateur ID : ${req.user.id}`);

        const checkUser = await db.query("SELECT id FROM users WHERE id = $1", [req.user.id]);
        if (checkUser.rows.length === 0) {
            console.warn(`⚠️ Aucun utilisateur trouvé avec ID : ${req.user.id}`);
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        const user = await db.query(
            "SELECT id, prenom, nom, email, tel, date_naissance, objectif, date_objectif FROM users WHERE id = $1",
            [req.user.id]
        );

        console.log("✅ Données utilisateur récupérées :", user.rows[0]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error("❌ ERREUR SERVEUR :", err.stack);
        res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
});

module.exports = router;
