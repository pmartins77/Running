const db = require("./db");

async function generateTrainingPlan(userId, data) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);

    const { objectifsIds, joursSelectionnes, sortieLongue, nbSeances } = data;
    
    console.log("📌 Objectifs reçus :", JSON.stringify(data, null, 2));

    // 🔹 Vérifier et convertir les dates d'objectifs
    const datesObjectifs = Object.keys(objectifsIds)
        .filter(dateStr => !isNaN(Date.parse(dateStr))) // Filtrer uniquement les dates valides
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a - b); // Trier les dates du plus proche au plus lointain

    if (datesObjectifs.length === 0) {
        console.error("❌ Aucune date d'objectif valide !");
        return [];
    }

    const dateObjectifPrincipal = datesObjectifs[datesObjectifs.length - 1]; // Prendre la date la plus éloignée
    const dateCle = dateObjectifPrincipal.toISOString().split("T")[0];
    const objectifPrincipalId = objectifsIds[dateCle];

    if (!objectifPrincipalId) {
        console.error("❌ Objectif principal introuvable !");
        return [];
    }

    console.log("📌 Objectif principal trouvé : ID =", objectifPrincipalId, "Date =", dateCle);

    // 🔹 Suppression des anciens entraînements
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    const trainingPlan = [];
    let currentDate = new Date();
    const endDate = new Date(dateObjectifPrincipal);

    if (isNaN(endDate)) {
        console.error("❌ Erreur : `endDate` est une valeur invalide !");
        return [];
    }

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
                is_generated: true,
                objectif_id: objectifsIds[currentDate.toISOString().split("T")[0]] || objectifPrincipalId
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
