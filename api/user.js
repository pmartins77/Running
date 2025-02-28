const express = require("express");
const router = express.Router();
const db = require("./db");
const authMiddleware = require("./authMiddleware");

// 📌 Récupérer les informations du profil utilisateur
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        console.log(`📌 Tentative de récupération du profil de l'utilisateur ID : ${req.user.id}`);

        // Vérifier si l'utilisateur existe
        const checkUser = await db.query("SELECT id FROM users WHERE id = $1", [req.user.id]);
        if (checkUser.rows.length === 0) {
            console.warn(`⚠️ Aucun utilisateur trouvé avec ID : ${req.user.id}`);
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        // Récupérer les données utilisateur
        const user = await db.query(
            "SELECT id, prenom, nom, email, tel, date_naissance, objectif, date_objectif FROM users WHERE id = $1",
            [req.user.id]
        );

        if (user.rows.length === 0) {
            console.warn(`⚠️ Profil introuvable pour l'ID : ${req.user.id}`);
            return res.status(404).json({ error: "Profil introuvable." });
        }

        console.log("✅ Données utilisateur récupérées :", user.rows[0]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error("❌ ERREUR SERVEUR :", err.stack);
        res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
});

// 📌 Mise à jour des informations utilisateur
router.put("/update", authMiddleware, async (req, res) => {
    const { prenom, nom, tel, date_naissance, objectif, date_objectif } = req.body;
    try {
        console.log(`📌 Mise à jour du profil utilisateur ID : ${req.user.id}`);

        await db.query(
            "UPDATE users SET prenom = $1, nom = $2, tel = $3, date_naissance = $4, objectif = $5, date_objectif = $6 WHERE id = $7",
            [prenom, nom, tel, date_naissance, objectif, date_objectif, req.user.id]
        );

        console.log("✅ Mise à jour réussie !");
        res.json({ message: "Profil mis à jour avec succès." });
    } catch (err) {
        console.error("❌ ERREUR SERVEUR lors de la mise à jour :", err.stack);
        res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
});

// 📌 Suppression du compte utilisateur
router.delete("/delete", authMiddleware, async (req, res) => {
    try {
        console.log(`📌 Suppression du compte utilisateur ID : ${req.user.id}`);

        await db.query("DELETE FROM users WHERE id = $1", [req.user.id]);

        console.log("✅ Compte supprimé avec succès !");
        res.json({ message: "Compte supprimé." });
    } catch (err) {
        console.error("❌ ERREUR SERVEUR lors de la suppression :", err.stack);
        res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
});

module.exports = router;
