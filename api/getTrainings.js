const express = require("express");
const router = express.Router();
const pool = require("./db");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// ✅ Middleware pour vérifier l'authentification
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Non autorisé." });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token invalide." });
        }
        req.userId = user.userId;
        next();
    });
}

// ✅ Route pour récupérer les entraînements de l'utilisateur connecté
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { date, year, month } = req.query;
        const userId = req.userId; // Récupérer l'utilisateur connecté

        if (date) {
            console.log(`📌 Requête SQL : SELECT * FROM trainings WHERE date = '${date}' AND user_id = ${userId}`);
            const result = await pool.query(
                "SELECT * FROM trainings WHERE date = $1 AND user_id = $2",
                [date, userId]
            );
            return res.json(result.rows);
        } 
        
        if (year && month) {
            console.log(`📌 Requête SQL : SELECT * FROM trainings WHERE YEAR = ${year} AND MONTH = ${month} AND user_id = ${userId}`);
            const result = await pool.query(
                "SELECT * FROM trainings WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 AND user_id = $3",
                [parseInt(year), parseInt(month), userId]
            );
            return res.json(result.rows);
        }

        return res.status(400).json({ error: "Paramètres invalides. Utilisez ?date=YYYY-MM-DD ou ?year=YYYY&month=MM" });

    } catch (error) {
        console.error("❌ Erreur récupération entraînements :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
