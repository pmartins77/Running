const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    // Ne pas appliquer l'authMiddleware à la route `/api/strava/callback`
    if (req.path === "/api/strava/callback") {
        return next();
    }

    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Accès interdit. Token manquant ou mal formaté." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error("❌ AuthMiddleware : Erreur de vérification du token :", error.message);
        return res.status(403).json({ error: "Token invalide." });
    }
};
