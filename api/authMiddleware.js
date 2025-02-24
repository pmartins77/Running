const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123"; // ✅ Doit correspondre à ton .env

module.exports = function (req, res, next) {
    const authHeader = req.headers["authorization"];
    console.log("📌 Vérification AuthMiddleware...");
    console.log("📌 Header Authorization reçu :", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("❌ AuthMiddleware : Token manquant ou mal formaté.");
        return res.status(403).json({ error: "Accès interdit. Token manquant ou invalide." });
    }

    const token = authHeader.split(" ")[1]; // ✅ Extraction du token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error("❌ Token invalide :", err.message);
            return res.status(403).json({ error: "Token invalide." });
        }
        req.userId = decoded.userId; // ✅ Ajout de l'ID utilisateur à la requête
        console.log("✅ Token valide, utilisateur ID :", req.userId);
        next(); // ✅ Passe à la suite
    });
};
