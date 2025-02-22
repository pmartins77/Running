const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123"; // ✅ Clé d'environnement sécurisée

// ✅ Route d'inscription (signup)
router.post("/signup", async (req, res) => {
    try {
        console.log("📌 Tentative d'inscription :", req.body);

        const { nom, prenom, email, mot_de_passe, sexe, date_de_naissance, objectif, date_objectif, autres } = req.body;
        const password = mot_de_passe; // ✅ Correction : uniformiser le nom de la variable


        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        // ✅ Vérification de la connexion PostgreSQL
        try {
            const testDB = await pool.query("SELECT NOW()");
            console.log("📌 Connexion DB OK, timestamp:", testDB.rows[0].now);
        } catch (err) {
            console.error("❌ ERREUR Connexion DB :", err);
            return res.status(500).json({ error: "Problème de connexion à la base de données." });
        }

        // ✅ Vérifier si l'utilisateur existe déjà
        console.log("📌 Vérification de l'email dans la base :", email);
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "L'utilisateur existe déjà." });
        }

        // ✅ Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insérer l'utilisateur
        const newUser = await pool.query(
            `INSERT INTO users (nom, prenom, email, password, sexe, date_de_naissance, objectif, date_objectif, autres)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, nom, prenom, email`,
            [nom, prenom, email, hashedPassword, sexe, date_de_naissance, objectif, date_objectif, autres]
        );

        // ✅ Générer le token JWT
        const user = newUser.rows[0];
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });

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

        // ✅ Vérification de la connexion PostgreSQL
        try {
            const testDB = await pool.query("SELECT NOW()");
            console.log("📌 Connexion DB OK, timestamp:", testDB.rows[0].now);
        } catch (err) {
            console.error("❌ ERREUR Connexion DB :", err);
            return res.status(500).json({ error: "Problème de connexion à la base de données." });
        }

        // ✅ Vérifier si l'utilisateur existe
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Utilisateur non trouvé." });
        }

        const user = userResult.rows[0];

        // ✅ Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Mot de passe incorrect." });
        }

        // ✅ Générer un token JWT
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });

        console.log("✅ Connexion réussie :", user.email);
        res.status(200).json({ token, user });

    } catch (error) {
        console.error("❌ ERREUR lors de la connexion :", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion." });
    }
});

module.exports = router;
