const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("⚠️ AuthMiddleware : Token manquant ou mal formaté.");
        return res.status(401).json({ error: "Accès interdit. Token manquant ou mal formaté." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            console.error("❌ AuthMiddleware : Token décodé invalide.");
            return res.status(403).json({ error: "Token invalide." });
        }

        req.user = { id: decoded.id };
        console.log(`✅ AuthMiddleware : Token valide, utilisateur ID : ${req.user.id}`);

        next();
    } catch (error) {
        console.error("❌ AuthMiddleware : Erreur lors de la vérification du token :", error.message);
        return res.status(403).json({ error: "Token invalide ou expiré." });
    }
};
