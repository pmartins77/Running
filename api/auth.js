const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const authMiddleware = require("./authMiddleware"); // ✅ Ajout du middleware

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123";

// ✅ Route d'inscription (signup)
router.post("/signup", async (req, res) => {
    try {
        const { nom, prenom, email, password, sexe, date_naissance, objectif, date_objectif, autres } = req.body;

        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "L'utilisateur existe déjà." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            `INSERT INTO users (nom, prenom, email, mot_de_passe, sexe, date_de_naissance, objectif, date_objectif, autres)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, nom, prenom, email`,
            [nom, prenom, email, hashedPassword, sexe, date_naissance, objectif, date_objectif, autres]
        );

        const token = jwt.sign({ userId: newUser.rows[0].id }, SECRET_KEY, { expiresIn: "7d" });
        res.status(201).json({ token, user: newUser.rows[0] });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
    }
});

// ✅ Route de connexion (login)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Utilisateur non trouvé." });
        }

        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.mot_de_passe);

        if (!validPassword) {
            return res.status(401).json({ error: "Mot de passe incorrect." });
        }

        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });
        res.status(200).json({ token, user });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur lors de la connexion." });
    }
});

// ✅ Route pour récupérer l'utilisateur connecté
router.get("/user", authMiddleware, async (req, res) => {
    try {
        const userResult = await pool.query("SELECT id, nom, prenom, email FROM users WHERE id = $1", [req.userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        res.status(200).json(userResult.rows[0]);
    } catch (error) {
        console.error("❌ Erreur récupération utilisateur :", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

module.exports = router;
