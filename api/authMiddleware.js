const jwt = require("jsonwebtoken");

const SECRET_KEY = "supersecretkey123"; // 🔒 Clé secrète pour vérifier les tokens

// ✅ Middleware pour protéger les routes
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ error: "Accès interdit, token requis." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.userId; // Stocke l'ID de l'utilisateur dans la requête
        next();
    } catch (error) {
        return res.status(403).json({ error: "Token invalide." });
    }
};

module.exports = authenticateUser;
