const express = require("express");
const router = express.Router();
const { pool } = require("./db");

router.delete("/", async (req, res) => {
    try {
        await pool.query("DELETE FROM trainings");
        res.status(200).json({ message: "Toutes les données ont été supprimées." });
    } catch (error) {
        console.error("Erreur lors de la suppression des données :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
});

module.exports = router;
