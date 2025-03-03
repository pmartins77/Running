const db = require("./db");

async function generateTrainingPlan(userId, data) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);

    const { objectif, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue, objectifsIntermediaires } = data;
    
    console.log("📌 Données reçues pour la génération :", data);

    // 🔹 Suppression des anciens entraînements
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    const trainingPlan = [];
    let currentDate = new Date();
    const endDate = new Date(dateEvent);

    console.log(`📌 Génération du plan entre ${currentDate.toISOString().split("T")[0]} et ${endDate.toISOString().split("T")[0]}`);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString("fr-FR", { weekday: "long" });

        if (joursSelectionnes.includes(dayOfWeek)) {
            const session = {
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
            };
            
            trainingPlan.push(session);
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📌 Nombre de séances générées : ${trainingPlan.length}`);

    if (trainingPlan.length === 0) {
        console.error("❌ Aucune séance générée !");
        return [];
    }

    console.log(`📌 Insertion des ${trainingPlan.length} entraînements en base de données...`);

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
