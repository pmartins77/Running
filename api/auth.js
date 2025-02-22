const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const authMiddleware = require("./authMiddleware"); // Middleware pour vérifier le token

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123"; // Clé JWT

// ✅ Route pour récupérer l'utilisateur connecté
router.get("/user", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await pool.query("SELECT id, email, nom, prenom FROM users WHERE id = $1", [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        res.json(user.rows[0]);

    } catch (error) {
        console.error("❌ Erreur récupération utilisateur :", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

module.exports = router;
