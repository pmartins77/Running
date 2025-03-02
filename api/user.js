const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// ✅ Récupérer le profil utilisateur
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await pool.query(
            "SELECT id, nom, prenom, email, sexe, date_de_naissance, telephone, objectif, date_objectif, autres, strava_id FROM users WHERE id = $1",
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        res.json(user.rows[0]);
    } catch (error) {
        console.error("❌ Erreur récupération profil :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération du profil." });
    }
});

// ✅ Modifier les infos du profil utilisateur (⚠️ Correction ici)
router.put("/update", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { nom, prenom, email, sexe, date_de_naissance, telephone, objectif, date_objectif, autres } = req.body;

        await pool.query(
            `UPDATE users SET nom=$1, prenom=$2, email=$3, sexe=$4, date_de_naissance=$5, telephone=$6, objectif=$7, date_objectif=$8, autres=$9 WHERE id=$10`,
            [nom, prenom, email, sexe, date_de_naissance, telephone, objectif, date_objectif, autres, userId]
        );

        res.json({ message: "✅ Profil mis à jour avec succès !" });
    } catch (error) {
        console.error("❌ Erreur mise à jour profil :", error);
        res.status(500).json({ error: "Erreur serveur lors de la mise à jour du profil." });
    }
});

// ✅ Changer le mot de passe
router.put("/profile/password", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword } = req.body;

        // Vérifier l'ancien mot de passe
        const user = await pool.query("SELECT mot_de_passe FROM users WHERE id = $1", [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        const validPassword = await bcrypt.compare(oldPassword, user.rows[0].mot_de_passe);
        if (!validPassword) {
            return res.status(401).json({ error: "Ancien mot de passe incorrect." });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET mot_de_passe = $1 WHERE id = $2", [hashedPassword, userId]);

        res.json({ message: "Mot de passe mis à jour avec succès." });
    } catch (error) {
        console.error("❌ Erreur changement mot de passe :", error);
        res.status(500).json({ error: "Erreur serveur lors du changement de mot de passe." });
    }
});

// ✅ Déconnexion Strava
router.post("/profile/strava/disconnect", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        await pool.query("UPDATE users SET strava_id = NULL, strava_token = NULL, strava_refresh_token = NULL, strava_expires_at = NULL WHERE id = $1", [userId]);

        res.json({ message: "Compte Strava déconnecté avec succès." });
    } catch (error) {
        console.error("❌ Erreur déconnexion Strava :", error);
        res.status(500).json({ error: "Erreur serveur lors de la déconnexion de Strava." });
    }
});

// ✅ Supprimer le compte utilisateur
router.delete("/profile", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        await pool.query("DELETE FROM users WHERE id = $1", [userId]);

        res.json({ message: "Compte supprimé avec succès." });
    } catch (error) {
        console.error("❌ Erreur suppression compte :", error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression du compte." });
    }
});

module.exports = router;
