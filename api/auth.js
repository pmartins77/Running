const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const authMiddleware = require("./authMiddleware");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123";

// ✅ Route d'inscription (signup)
router.post("/signup", async (req, res) => {
    try {
        console.log("📌 Tentative d'inscription :", req.body);

        const { nom, prenom, email, password } = req.body;

        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "L'utilisateur existe déjà." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `INSERT INTO users (nom, prenom, email, mot_de_passe)
             VALUES ($1, $2, $3, $4) RETURNING id, nom, prenom, email`,
            [nom, prenom, email, hashedPassword]
        );

        const user = newUser.rows[0];
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "7d" });

        console.log("✅ Inscription réussie :", user);
        res.status(201).json({ token, user });

    } catch (error) {
        console.error("❌ ERREUR lors de l'inscription :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
    }
});

// ✅ Route de connexion (login)
router.post("/login", async (req, res) => {
    try {
        console.log("📌 Tentative de connexion :", req.body);

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email et mot de passe requis." });
        }

        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Utilisateur non trouvé." });
        }

        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.mot_de_passe);
        if (!validPassword) {
            return res.status(401).json({ error: "Mot de passe incorrect." }); // ✅ BUG corrigé ici
        }

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "7d" });

        console.log("✅ Connexion réussie :", user.email);
        res.status(200).json({ token, user });

    } catch (error) {
        console.error("❌ ERREUR lors de la connexion :", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion." });
    }
});

// ✅ Route pour récupérer les infos de l'utilisateur connecté
router.get("/user", authMiddleware, async (req, res) => {
    try {
        console.log(`📌 Récupération des infos utilisateur pour ID : ${req.user.id}`);
        const user = await pool.query("SELECT id, nom, prenom, email FROM users WHERE id = $1", [req.user.id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        res.status(200).json(user.rows[0]);
    } catch (error) {
        console.error("❌ ERREUR Vérification Token :", error);
        res.status(403).json({ error: "Token invalide." });
    }
});

module.exports = router;
