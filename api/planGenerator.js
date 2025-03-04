const db = require("./db");

async function generateTrainingPlan(userId, data) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);
    console.log("📌 Objectifs reçus :", JSON.stringify(data, null, 2));

    if (!data.objectifPrincipalId) {
        console.error("❌ Objectif principal manquant !");
        return { error: "Objectif principal introuvable." };
    }

    // 🔹 Vérifier l'existence de l'objectif principal
    const objectifPrincipal = await db.query(
        "SELECT * FROM objectifs WHERE id = $1", 
        [data.objectifPrincipalId]
    );

    if (objectifPrincipal.rows.length === 0) {
        console.error("❌ Objectif principal non trouvé en base !");
        return { error: "Objectif principal non trouvé." };
    }

    const objectif = objectifPrincipal.rows[0];
    const dateObjectifPrincipal = new Date(objectif.date_event);

    if (isNaN(dateObjectifPrincipal.getTime())) {
        console.error("❌ Date de l'objectif principal invalide !");
        return { error: "Date de l'objectif principal invalide." };
    }

    console.log(`📌 Objectif principal validé : ${objectif.type} prévu pour ${dateObjectifPrincipal.toISOString().split("T")[0]}`);

    // 🔹 Suppression des anciens entraînements générés
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

        if (data.joursSelectionnes.includes(dayOfWeek)) {
            console.log(`✅ Séance ajoutée pour le ${dayOfWeek} (${currentDate.toISOString().split("T")[0]})`);

            const typeSeance = choisirTypeSeance();
            const session = {
                user_id: userId,
                date: currentDate.toISOString().split("T")[0],
                type: typeSeance,
                duration: 60,
                intensity: definirIntensite(typeSeance),
                echauffement: "15 min footing en zone 2",
                recuperation: "10 min footing en zone 1",
                fc_cible: definirZoneFC(typeSeance),
                zone_fc: definirZoneFC(typeSeance),
                details: `Séance de ${typeSeance}`,
                is_generated: true,
                objectif_id: objectif.id
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

// 🔹 Sélection du type de séance (alternance entre les types pour diversifier)
function choisirTypeSeance() {
    const types = ["Endurance", "Seuil", "VMA", "Fractionné", "Récupération"];
    return types[Math.floor(Math.random() * types.length)];
}

// 🔹 Définir l’intensité en fonction du type de séance
function definirIntensite(type) {
    switch (type) {
        case "Endurance": return "Modérée";
        case "Seuil": return "Élevée";
        case "VMA": return "Très élevée";
        case "Fractionné": return "Variable";
        case "Récupération": return "Faible";
        default: return "Modérée";
    }
}

// 🔹 Définir la zone FC en fonction du type de séance
function definirZoneFC(type) {
    switch (type) {
        case "Endurance": return "Zone 2 - Aérobie (65-75%)";
        case "Seuil": return "Zone 3 - Seuil (80-90%)";
        case "VMA": return "Zone 4 - Anaérobie (90-100%)";
        case "Fractionné": return "Zones variées";
        case "Récupération": return "Zone 1 - Récupération (50-60%)";
        default: return "Zone 2 - Aérobie (65-75%)";
    }
}

module.exports = generateTrainingPlan;
