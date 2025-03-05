const express = require("express");
const router = express.Router();
const pool = require("./db");
const { authenticateToken } = require("./authMiddleware");

// Route pour récupérer les entraînements avec tous les détails
router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT 
                t.id, t.date, t.duration, t.type, t.intensity, t.details, t.recovery, 
                t.echauffement, t.fc_cible, t.zone_fc, t.planifie_par_ai, 
                t.objectif_id, t.is_generated, 
                s.total_elevation_gain, s.average_heartrate, s.calories, s.distance, 
                s.elapsed_time, s.average_speed, s.max_speed, s.average_cadence,
                o.type AS objectif_type, o.denivele_total, o.allures_reference, 
                o.vma_estimee, o.fc_max_estimee, o.contraintes, o.nutrition, o.terrain, 
                o.intensite, o.blessures
            FROM trainings t
            LEFT JOIN strava_activities s ON t.user_id = s.user_id AND t.date = s.date
            LEFT JOIN objectifs o ON t.objectif_id = o.id
            WHERE t.user_id = $1
            ORDER BY t.date DESC
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur serveur");
    }
});

module.exports = router;
