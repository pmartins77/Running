const db = require("./db");

async function generateTrainingPlan(userId) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);

    const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (!user.rows.length) {
        console.error("❌ Utilisateur introuvable !");
        throw new Error("Utilisateur introuvable");
    }

    console.log(`✅ Préférences utilisateur récupérées :`, user.rows[0]);

    const activities = await db.query(
        "SELECT * FROM strava_activities WHERE user_id = $1 ORDER BY date DESC LIMIT 60", 
        [userId]
    );

    console.log(`📌 Nombre d'activités Strava récupérées : ${activities.rows.length}`);
    if (activities.rows.length === 0) {
        console.warn("⚠️ Aucune activité Strava trouvée, le plan pourrait être limité.");
    }

    const trainingPlan = [];
    for (let i = 0; i < 4; i++) {
        trainingPlan.push({
            user_id: userId,
            date: new Date(new Date().setDate(new Date().getDate() + i * 7)), // Séances hebdomadaires
            type: "Entraînement",
            duration: 60,
            intensity: "Modéré",
            details: "Séance automatique",
            is_generated: true
        });
    }

    console.log(`📌 Suppression des anciens entraînements générés`);
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    console.log(`📌 Insertion des nouveaux entraînements`);
    for (const session of trainingPlan) {
        await db.query(
            "INSERT INTO trainings (user_id, date, type, duration, intensity, details, is_generated) VALUES ($1, $2, $3, $4, $5, $6, $7)", 
            [session.user_id, session.date, session.type, session.duration, session.intensity, session.details, session.is_generated]
        );
    }

    console.log("✅ Plan inséré avec succès !");
    return trainingPlan;
}

module.exports = generateTrainingPlan;
