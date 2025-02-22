const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123";

// ✅ Route pour l'inscription des utilisateurs
router.post("/signup", async (req, res) => {
    try {
        console.log("📌 Tentative d'inscription :", req.body);

        const { nom, prenom, email, password, sexe, date_naissance, objectif, date_objectif, autres } = req.body;

        if (!nom || !prenom || !email || !password) {
            console.error("❌ Erreur : Champs obligatoires manquants.");
            return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
        }

        // ✅ Vérifier si l'utilisateur existe déjà
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            console.error("❌ Erreur : Utilisateur déjà existant.");
            return res.status(400).json({ error: "L'utilisateur existe déjà." });
        }

        // ✅ Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Vérifier si la colonne `autres` existe avant d'insérer
        const columns = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'autres'
        `);
        const autresExists = columns.rows.length > 0;

        // ✅ Construire la requête dynamiquement en fonction de la présence de la colonne `autres`
        let query = `INSERT INTO users (nom, prenom, email, mot_de_passe, sexe, date_de_naissance, objectif, date_objectif`;
        let values = [nom, prenom, email, hashedPassword, sexe || null, date_naissance || null, objectif || null, date_objectif || null];
        let placeholders = `$1, $2, $3, $4, $5, $6, $7, $8`;

        if (autresExists) {
            query += `, autres`;
            values.push(autres || null);
            placeholders += `, $9`;
        }

        query += `) VALUES (${placeholders}) RETURNING id, nom, prenom, email`;

        // ✅ Insérer l'utilisateur dans la base
        const newUser = await pool.query(query, values);

        // ✅ Générer un token JWT
        const user = newUser.rows[0];
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });

        console.log("✅ Inscription réussie :", user);
        res.status(201).json({ token, user });

    } catch (error) {
        console.error("❌ ERREUR lors de l'inscription :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'inscription.", details: error.message });
    }
});

module.exports = router;
