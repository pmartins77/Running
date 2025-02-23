const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123";

module.exports = function (req, res, next) {
    console.log("📌 Vérification AuthMiddleware...");
    
    const authHeader = req.headers["authorization"];
    console.log("📌 Header Authorization reçu :", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("❌ AuthMiddleware : Token manquant ou mal formaté.");
        return res.status(403).json({ error: "Accès interdit. Token manquant ou invalide." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log("✅ Token valide, utilisateur ID :", decoded.userId);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error("❌ AuthMiddleware : Token invalide.", error);
        return res.status(403).json({ error: "Token invalide." });
    }
};
