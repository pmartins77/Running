const db = require("./db");

async function generateTrainingPlan(userId, data) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);

    const { objectifsIds, joursSelectionnes, sortieLongue, nbSeances } = data;
    
    console.log("📌 Objectifs reçus :", JSON.stringify(data, null, 2));

    // 🔹 Vérifier que l'objectif principal existe bien
    const datesObjectifs = Object.keys(objectifsIds).map(date => new Date(date)).sort((a, b) => a - b);
    const dateObjectifPrincipal = datesObjectifs[datesObjectifs.length - 1];

    const dateKey = dateObjectifPrincipal.toISOString().split("T")[0];
    const objectifPrincipalId = objectifsIds[dateKey];

    if (!objectifPrincipalId || isNaN(dateObjectifPrincipal.getTime())) {
        console.error("❌ Objectif principal introuvable ou date invalide !");
        return [];
    }

    console.log(`📌 Objectif principal trouvé : ID=${objectifPrincipalId}, Date=${dateKey}`);

    // 🔹 Suppression des anciens entraînements
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    const trainingPlan = [];
    let currentDate = new Date();
    const endDate = new Date(dateObjectifPrincipal);

    console.log(`📌 Génération du plan entre ${currentDate.toISOString().split("T")[0]} et ${endDate.toISOString().split("T")[0]}`);

    // 🔹 Normalisation des jours pour éviter les erreurs de format
    const joursNormaux = {
        "lundi": "Lundi",
        "mardi": "Mardi",
        "mercredi": "Mercredi",
        "jeudi": "Jeudi",
        "vendredi": "Vendredi",
        "samedi": "Samedi",
        "dimanche": "Dimanche"
    };

    while (currentDate <= endDate) {
        let dayOfWeek = currentDate.toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();
        dayOfWeek = joursNormaux[dayOfWeek] || dayOfWeek; // Récupérer le format correct

        console.log(`📌 Vérification du jour : ${dayOfWeek}`);

        if (joursSelectionnes.includes(dayOfWeek)) {
            console.log(`✅ Séance ajoutée pour le ${dayOfWeek} (${currentDate.toISOString().split("T")[0]})`);

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

        // 🔹 Passage au jour suivant
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📌 Nombre de séances générées : ${trainingPlan.length}`);

    if (trainingPlan.length === 0) {
        console.warn("⚠️ Aucune séance générée !");
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
