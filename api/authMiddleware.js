const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("❌ AuthMiddleware : Token manquant ou mal formaté.");
        return res.status(401).json({ error: "Accès interdit. Token manquant ou mal formaté." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        console.log("✅ Token valide, utilisateur ID :", req.userId);
        next();
    } catch (error) {
        console.error("❌ AuthMiddleware : Erreur lors de la vérification du token :", error.message);
        return res.status(403).json({ error: "Token invalide." });
    }
};
