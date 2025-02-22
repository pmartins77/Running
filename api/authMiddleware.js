const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123"; // ✅ Doit correspondre à ton .env

module.exports = function (req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ error: "Accès interdit. Token manquant ou invalide." });
    }

    const token = authHeader.split(" ")[1]; // Extraction du token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Token invalide." });
        }
        req.userId = decoded.userId; // ✅ Ajout de l'ID utilisateur à la requête
        next(); // ✅ Passe à la suite
    });
};
