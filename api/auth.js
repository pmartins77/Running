const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey"; // Clé secrète JWT

// ✅ Inscription
router.post("/signup", async (req, res) => {
    try {
        const { email, mot_de_passe, nom, prenom, sexe, date_de_naissance, objectif, date_objectif } = req.body;

        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }

        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        await pool.query(
            `INSERT INTO users (email, mot_de_passe, nom, prenom, sexe, date_de_naissance, objectif, date_objectif)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [email, hashedPassword, nom, prenom, sexe, date_de_naissance, objectif, date_objectif]
        );

        res.status(201).json({ message: "Inscription réussie !" });
    } catch (error) {
        console.error("❌ Erreur inscription :", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// ✅ Connexion
router.post("/login", async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const isValid = await bcrypt.compare(mot_de_passe, user.rows[0].mot_de_passe);
        if (!isValid) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const token = jwt.sign({ userId: user.rows[0].id }, SECRET_KEY, { expiresIn: "7d" });

        res.json({ token });
    } catch (error) {
        console.error("❌ Erreur connexion :", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

module.exports = router;
