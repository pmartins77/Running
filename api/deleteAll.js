const { pool } = require("./db");

const handler = async (req, res) => {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }

    try {
        await pool.query("DELETE FROM trainings"); // Correction du nom de la table
        res.status(200).json({ message: "Toutes les données ont été supprimées" });
    } catch (error) {
        console.error("Erreur lors de la suppression des données:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

module.exports = handler;
