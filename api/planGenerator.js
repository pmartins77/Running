const db = require("./db");

async function generateTrainingPlan(userId) {
    // 1️⃣ Récupérer les préférences de l'utilisateur
    const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (!user.rows.length) throw new Error("Utilisateur introuvable");

    const { training_days_per_week, preferred_long_run_day, preferred_strength_day, preferred_training_days } = user.rows[0];

    // 2️⃣ Récupérer les 60 dernières activités Strava
    const activities = await db.query(
        "SELECT * FROM strava_activities WHERE user_id = $1 ORDER BY date DESC LIMIT 60", 
        [userId]
    );

    if (!activities.rows.length) throw new Error("Pas de données Strava trouvées");

    // 3️⃣ Analyser les performances moyennes
    const avgSpeed = activities.rows.reduce((sum, act) => sum + act.average_speed, 0) / activities.rows.length;
    const avgDistance = activities.rows.reduce((sum, act) => sum + act.distance, 0) / activities.rows.length;

    // 4️⃣ Déterminer le plan d’entraînement
    const trainingPlan = [];
    const days = preferred_training_days.split(",");

    for (let i = 0; i < training_days_per_week; i++) {
        let type = "Endurance";
        if (days[i] === preferred_long_run_day) type = "Sortie Longue";
        if (days[i] === preferred_strength_day) type = "Renforcement Musculaire";

        trainingPlan.push({
            user_id: userId,
            date: new Date(new Date().setDate(new Date().getDate() + i * 7)), // Semaine par semaine
            type,
            duration: type === "Sortie Longue" ? 90 : 60, // Longue durée pour sortie longue
            intensity: type === "Renforcement Musculaire" ? "Faible" : "Modéré",
            details: `${type} basé sur votre allure de ${avgSpeed.toFixed(2)} km/h`,
            is_generated: true
        });
    }

    // 5️⃣ Supprimer les anciens entraînements générés
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    // 6️⃣ Insérer le nouveau plan
    for (const session of trainingPlan) {
        await db.query(
            "INSERT INTO trainings (user_id, date, type, duration, intensity, details, is_generated) VALUES ($1, $2, $3, $4, $5, $6, $7)", 
            [session.user_id, session.date, session.type, session.duration, session.intensity, session.details, session.is_generated]
        );
    }

    return trainingPlan;
}

module.exports = generateTrainingPlan;
