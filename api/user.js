const express = require("express");
const router = express.Router();
const db = require("./db");
const authMiddleware = require("./authMiddleware");

// Récupérer les infos de l'utilisateur
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await db.query(
            "SELECT prenom, nom, email, tel, date_naissance, objectif, date_objectif FROM users WHERE id = $1",
            [req.user.id]
        );
        res.json(user.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// Modifier les infos utilisateur
router.put("/update", authMiddleware, async (req, res) => {
    const { prenom, nom, tel, date_naissance, objectif, date_objectif } = req.body;
    try {
        await db.query(
            "UPDATE users SET prenom = $1, nom = $2, tel = $3, date_naissance = $4, objectif = $5, date_objectif = $6 WHERE id = $7",
            [prenom, nom, tel, date_naissance, objectif, date_objectif, req.user.id]
        );
        res.json({ message: "Profil mis à jour." });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// Supprimer un compte
router.delete("/delete", authMiddleware, async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE id = $1", [req.user.id]);
        res.json({ message: "Compte supprimé." });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur." });
    }
});

module.exports = router;
