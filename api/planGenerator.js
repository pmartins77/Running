const db = require("./db");

async function generateTrainingPlan(userId, data) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);

    const { objectif, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue, objectifsIntermediaires } = data;
    
    console.log("📌 Données reçues pour la génération :", data);

    if (!dateEvent) {
        console.error("❌ ERREUR : `dateEvent` est undefined dans generateTrainingPlan !");
        return [];
    }

    // 🔹 Vérification et récupération des objectifs
    const objectifsIds = {};

    console.log(`📌 Recherche de l'objectif principal (date_event = ${dateEvent})...`);
    const objectifPrincipal = await db.query(
        `SELECT id FROM objectifs WHERE user_id = $1 AND date_event = $2::DATE`,
        [userId, dateEvent]
    );

    if (objectifPrincipal.rows.length === 0) {
        console.error("❌ Objectif principal introuvable !");
        return [];
    }

    objectifsIds[dateEvent] = objectifPrincipal.rows[0].id;
    console.log(`✅ Objectif principal trouvé avec ID : ${objectifPrincipal.rows[0].id}`);

    for (let obj of objectifsIntermediaires) {
        console.log(`📌 Recherche de l'objectif intermédiaire (date_event = ${obj.date})...`);
        const objQuery = await db.query(
            `SELECT id FROM objectifs WHERE user_id = $1 AND date_event = $2::DATE`,
            [userId, obj.date]
        );
        if (objQuery.rows.length > 0) {
            objectifsIds[obj.date] = objQuery.rows[0].id;
            console.log(`✅ Objectif intermédiaire trouvé avec ID : ${objQuery.rows[0].id}`);
        }
    }

    console.log("📌 Objectifs liés aux entraînements :", objectifsIds);

    // 🔹 Suppression des anciens entraînements générés
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    const trainingPlan = [];
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateEvent);
    endDate.setHours(0, 0, 0, 0);

    console.log(`📌 Génération du plan entre ${currentDate.toISOString().split("T")[0]} et ${endDate.toISOString().split("T")[0]}`);

    while (currentDate <= endDate) {
        const dateISO = currentDate.toISOString().split("T")[0];
        const dayOfWeek = currentDate.toLocaleDateString("fr-FR", { weekday: "long" });

        if (joursSelectionnes.includes(dayOfWeek)) {
            let objectifId = objectifsIds[dateISO] || objectifsIds[dateEvent];
            let isRaceDay = objectifsIds[dateISO] ? true : false;

            const session = {
                user_id: userId,
                date: dateISO,
                type: isRaceDay ? "Course" : "Entraînement",
                duration: isRaceDay ? "Compétition" : 60,
                intensity: isRaceDay ? "Haute" : "Modérée",
                echauffement: isRaceDay ? "Préparez-vous pour la course !" : "15 min footing en zone 2",
                recuperation: isRaceDay ? "Repos complet" : "10 min footing en zone 1",
                fc_cible: "140 - 160 BPM",
                zone_fc: isRaceDay ? "Compétition" : "Zone 3 - Endurance",
                details: isRaceDay ? `Jour de course : ${objectifId === objectifsIds[dateEvent] ? "Objectif principal" : "Objectif intermédiaire"}` : "Séance automatique",
                is_generated: true,
                objectif_id: objectifId
            };

            if (dayOfWeek === sortieLongue) {
                session.type = "Sortie Longue";
                session.duration = 90;
                session.details = "Séance longue spécifique";
                session.intensity = "Moyenne";
            }

            trainingPlan.push(session);
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
                session.fc_cible, session.zone_fc, session.details, session.is_generated,
                session.objectif_id
            ]
        );
    }

    console.log("✅ Plan inséré avec succès !");
    return trainingPlan;
}

module.exports = generateTrainingPlan;
