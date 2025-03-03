const db = require("./db");

async function generateTrainingPlan(userId, data) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);

    const { objectif, objectifAutre, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue, objectifsIntermediaires } = data;

    // 🔹 Suppression des anciens entraînements
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    const trainingPlan = [];
    let currentDate = new Date();
    const endDate = new Date(dateEvent);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString("fr-FR", { weekday: "long" });

        if (joursSelectionnes.includes(dayOfWeek)) {
            trainingPlan.push({
                user_id: userId,
                date: currentDate.toISOString().split("T")[0],
                type: "Entraînement",
                duration: 60,
                intensity: "Modérée",
                echauffement: "15 min footing en zone 2",
                recuperation: "10 min footing en zone 1",
                fc_cible: "140 - 160 BPM",
                zone_fc: "Zone 3 - Endurance",
                details: "Séance automatique",
                is_generated: true
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📌 Insertion des nouveaux entraînements`);
    for (const session of trainingPlan) {
        await db.query(
            `INSERT INTO trainings 
            (user_id, date, type, duration, intensity, echauffement, recuperation, fc_cible, zone_fc, details, is_generated) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, 
            [
                session.user_id, session.date, session.type, session.duration, 
                session.intensity, session.echauffement, session.recuperation,
                session.fc_cible, session.zone_fc, session.details, session.is_generated
            ]
        );
    }

    console.log("✅ Plan inséré avec succès !");
    return trainingPlan;
}

module.exports = generateTrainingPlan;
