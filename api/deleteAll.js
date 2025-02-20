// /api/deleteAll.js (Suppression totale des entraînements)
const express = require("express");
const router = express.Router();
const { pool } = require("./db");

router.delete("/", async (req, res) => {
    try {
        await pool.query("DELETE FROM trainings");
        res.json({ message: "Toutes les données ont été supprimées !" });
    } catch (error) {
        console.error("Erreur suppression :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
