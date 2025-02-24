const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123";

module.exports = function (req, res, next) {
    const authHeader = req.headers["authorization"];
    console.log("📌 Vérification AuthMiddleware...");
    console.log("📌 Header Authorization reçu :", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("❌ AuthMiddleware : Token manquant ou mal formaté.");
        return res.status(403).json({ error: "Accès interdit. Token manquant ou invalide." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.userId;
        console.log("✅ Token valide, utilisateur ID :", req.userId);
        next();
    } catch (error) {
        console.error("❌ Token invalide :", error.message);
        res.status(403).json({ error: "Token invalide." });
    }
};
