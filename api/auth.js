const express = require("express");
const bcrypt = require("bcryptjs"); // ✅ Utilisation de bcryptjs au lieu de bcrypt
const jwt = require("jsonwebtoken");
const { pool } = require("./db"); // ✅ Assure que la connexion PostgreSQL est bien importée

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// ✅ Route pour l'inscription des utilisateurs
router.post("/signup", async (req, res) => {
    try {
        console.log("📌 Tentative d'inscription :", req.body);

        const { nom, prenom, email, password, sexe, date_naissance, objectif, date_objectif, autres } = req.body;

        if (!nom || !prenom || !email || !password) {
            console.error("❌ Erreur : Champs obligatoires manquants.");
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        // Vérifier si l'utilisateur existe déjà
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            console.error("❌ Erreur : Utilisateur déjà existant.");
            return res.status(400).json({ error: "L'utilisateur existe déjà." });
        }

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer l'utilisateur dans la base
        const newUser = await pool.query(
            `INSERT INTO users (nom, prenom, email, password, sexe, date_naissance, objectif, date_objectif, autres)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, nom, prenom, email`,
            [nom, prenom, email, hashedPassword, sexe, date_naissance, objectif, date_objectif, autres]
        );

        // Générer un token JWT
        const user = newUser.rows[0];
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });

        console.log("✅ Inscription réussie :", user);
        res.status(201).json({ token, user });

    } catch (error) {
        console.error("❌ ERREUR lors de l'inscription :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
    }
});

module.exports = router;
