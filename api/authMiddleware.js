const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123"; // ✅ Assure-toi que c'est bien la clé utilisée

module.exports = function (req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("❌ AuthMiddleware : Token manquant ou mal formaté.");
        return res.status(403).json({ error: "Accès interdit. Token manquant ou invalide." });
    }

    const token = authHeader.split(" ")[1]; // Extraction du token
    console.log("📌 Token reçu dans Middleware :", token);

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error("❌ AuthMiddleware : Token invalide.");
            return res.status(403).json({ error: "Token invalide." });
        }
        req.userId = decoded.userId;
        console.log("✅ Token valide, User ID :", req.userId);
        next();
    });
};
