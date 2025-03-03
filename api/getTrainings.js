const db = require("./db");

async function generateTrainingPlan(userId, objectifsIds, joursSelectionnes, sortieLongue) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);
    console.log("📌 Objectifs reçus :", objectifsIds);

    // Convertir les dates en objets Date pour bien trier
    const objectifsArray = Object.entries(objectifsIds).map(([dateStr, id]) => ({
        date: new Date(dateStr), 
        id
    }));

    // Trier les objectifs par date ASCENDANTE (plus ancienne en premier)
    objectifsArray.sort((a, b) => a.date - b.date);

    // Sélectionner **le dernier objectif**, qui est **l'objectif principal**
    const objectifPrincipal = objectifsArray.pop(); // Dernier élément
    const objectifPrincipalId = objectifPrincipal.id;
    const objectifPrincipalDate = objectifPrincipal.date;

    if (!objectifPrincipalId || !objectifPrincipalDate) {
        console.error("❌ Objectif principal introuvable !");
        return [];
    }

    console.log(`📌 Objectif principal correct : ID=${objectifPrincipalId}, Date=${objectifPrincipalDate.toISOString().split("T")[0]}`);

    // 🔹 Suppression des anciens entraînements
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    const trainingPlan = [];
    let currentDate = new Date();
    const endDate = new Date(objectifPrincipalDate); // Correctement récupéré

    console.log(`📌 Génération du plan entre ${currentDate.toISOString().split("T")[0]} et ${endDate.toISOString().split("T")[0]}`);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString("fr-FR", { weekday: "long" });

        if (joursSelectionnes.includes(dayOfWeek)) {
            const objectifId = objectifsIds[currentDate.toISOString().split("T")[0]] || objectifPrincipalId;
            const isRaceDay = objectifsIds[currentDate.toISOString().split("T")[0]] ? true : false;

            trainingPlan.push({
                user_id: userId,
                date: currentDate.toISOString().split("T")[0],
                type: isRaceDay ? "Course" : "Entraînement",
                duration: isRaceDay ? "Compétition" : 60,
                intensity: isRaceDay ? "Haute" : "Modérée",
                echauffement: isRaceDay ? "Préparez-vous pour la course !" : "15 min footing en zone 2",
                recuperation: isRaceDay ? "Repos complet" : "10 min footing en zone 1",
                fc_cible: "140 - 160 BPM",
                zone_fc: isRaceDay ? "Compétition" : "Zone 3 - Endurance",
                details: isRaceDay ? `Jour de course : ${objectifId === objectifPrincipalId ? "Objectif principal" : "Objectif intermédiaire"}` : "Séance automatique",
                is_generated: true,
                objectif_id: objectifId
            });
        }

        // Passer au jour suivant
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
            (user_id, date, type, duration, intensity, echauffement, recuperation, fc_cible, zone_fc, details, is_generated, objectif_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, 
            [
                session.user_id, session.date, session.type, session.duration,
                session.intensity, session.echauffement, session.recuperation,
                session.fc_cible, session.zone_fc, session.details,
                session.is_generated, session.objectif_id
            ]
        );
    }

    console.log("✅ Plan inséré avec succès !");
    return trainingPlan;
}

module.exports = generateTrainingPlan;
