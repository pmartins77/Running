const db = require("./db");

async function generateTrainingPlan(userId, data) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);

    const { objectifPrincipalId, joursSelectionnes, sortieLongue, nbSeances, deniveleTotal, dateEvent } = data;
    
    console.log("📌 Objectifs reçus :", JSON.stringify(data, null, 2));

    // ✅ Vérifier que l'objectif principal existe bien
    if (!objectifPrincipalId || !dateEvent) {
        console.error("❌ Objectif principal ou date invalide !");
        return { error: "Objectif principal ou date invalide." };
    }

    // ✅ Convertir la date d'événement en objet `Date`
    const endDate = new Date(dateEvent);
    if (isNaN(endDate.getTime())) {
        console.error("❌ Date de l'événement invalide :", dateEvent);
        return { error: "Date de l'événement invalide." };
    }

    // ✅ Suppression des anciens entraînements générés
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    const trainingPlan = [];
    let currentDate = new Date(); // Date actuelle

    console.log(`📌 Génération du plan entre ${currentDate.toISOString().split("T")[0]} et ${endDate.toISOString().split("T")[0]}`);

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
        if (isNaN(currentDate.getTime())) {
            console.error("❌ Erreur : Date courante invalide !");
            return { error: "Erreur interne lors de la génération du plan." };
        }

        let dayOfWeek = currentDate.toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();
        dayOfWeek = joursNormaux[dayOfWeek] || dayOfWeek;

        console.log(`📌 Vérification du jour : ${dayOfWeek}`);

        if (joursSelectionnes.includes(dayOfWeek)) {
            console.log(`✅ Séance ajoutée pour le ${dayOfWeek} (${currentDate.toISOString().split("T")[0]})`);

            const typeSeance = choisirTypeSeance();
            const session = {
                user_id: userId,
                date: currentDate.toISOString().split("T")[0],
                type: typeSeance,
                duration: definirDuree(typeSeance, endDate, currentDate),
                intensity: definirIntensite(typeSeance),
                echauffement: "15 min footing en zone 2",
                recuperation: "10 min footing en zone 1",
                fc_cible: definirZoneFC(typeSeance),
                zone_fc: definirZoneFC(typeSeance),
                details: `Séance de ${typeSeance}`,
                is_generated: true,
                objectif_id: objectifPrincipalId
            };

            trainingPlan.push(session);
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📌 Nombre de séances générées : ${trainingPlan.length}`);

    if (trainingPlan.length === 0) {
        console.warn("⚠️ Aucune séance générée !");
        return { error: "Aucune séance générée." };
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

// 🔹 Définir la durée en fonction du type de séance et de la date
function definirDuree(type, endDate, currentDate) {
    const semainesRestantes = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24 * 7));
    
    if (semainesRestantes <= 1) return 30; // Semaine de la course : récupération
    if (type === "Endurance" || type === "Sortie Longue") return 90;
    if (type === "Seuil") return 60;
    if (type === "VMA") return 45;
    return 60;
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
