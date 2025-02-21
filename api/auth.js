const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const router = express.Router();
const SECRET_KEY = "supersecretkey123"; // 🔒 Clé secrète JWT (fixée ici pour correspondre à la variable sur Vercel)

// ✅ Route pour l'inscription
router.post("/signup", async (req, res) => {
    const client = await pool.connect();
    try {
        console.log("📌 Tentative d'inscription :", req.body);

        const { nom, prenom, email, password, sexe, date_naissance, objectif, date_objectif } = req.body;

        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        // Vérifier si l'utilisateur existe déjà
        const userExists = await client.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "L'utilisateur existe déjà." });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer l'utilisateur
        const newUser = await client.query(
            `INSERT INTO users (nom, prenom, email, mot_de_passe, sexe, date_de_naissance, objectif, date_objectif)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nom, prenom, email`,
            [nom, prenom, email, hashedPassword, sexe, date_naissance, objectif, date_objectif]
        );

        const user = newUser.rows[0];
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });

        res.status(201).json({ token, user });
    } catch (error) {
        console.error("❌ ERREUR lors de l'inscription :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
    } finally {
        client.release();
    }
});

// ✅ Route pour la connexion
router.post("/login", async (req, res) => {
    const client = await pool.connect();
    try {
        console.log("📌 Tentative de connexion :", req.body);

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email et mot de passe requis." });
        }

        // Vérifier si l'utilisateur existe
        const userResult = await client.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Utilisateur non trouvé." });
        }

        const user = userResult.rows[0];

        // Vérification du mot de passe
        const isValid = await bcrypt.compare(password, user.mot_de_passe);
        if (!isValid) {
            return res.status(400).json({ error: "Mot de passe incorrect." });
        }

        // Générer un token JWT
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });

        res.json({ token, user });
    } catch (error) {
        console.error("❌ ERREUR lors de la connexion :", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion." });
    } finally {
        client.release();
    }
});

module.exports = router;
