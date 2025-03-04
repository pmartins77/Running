const db = require("./db");
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 🔹 Fonction pour générer un plan d'entraînement avec l'IA
async function generateAIPlan(userId, data) {
    console.log(`📌 Début de la génération IA du plan pour l'utilisateur ${userId}`);

    const { objectif, intensite, terrain, dateEvent, nbSeances, deniveleTotal, joursSelectionnes, sortieLongue, objectifsIntermediaires } = data;

    // 🔹 Vérifier que tous les paramètres sont bien définis
    if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances || !joursSelectionnes.length || !sortieLongue) {
        console.error("❌ Paramètres invalides pour la génération IA !");
        return { error: "Données invalides" };
    }

    console.log("📌 Paramètres envoyés à l'IA :", JSON.stringify(data, null, 2));

    try {
        // 🔹 Préparation de la requête IA
        const prompt = `
        Je suis un coach spécialisé en entraînement running. Mon utilisateur veut un plan d'entraînement pour un ${objectif}, sur terrain ${terrain} avec une intensité ${intensite}.
        Il reste ${Math.ceil((new Date(dateEvent) - new Date()) / (1000 * 60 * 60 * 24 * 7))} semaines avant la course.
        Il s'entraîne ${nbSeances} fois par semaine, les jours suivants : ${joursSelectionnes.join(", ")}.
        La sortie longue est le ${sortieLongue}.
        Le dénivelé total de la course est de ${deniveleTotal} mètres.
        Ses objectifs intermédiaires : ${objectifsIntermediaires.length > 0 ? JSON.stringify(objectifsIntermediaires) : "Aucun"}.

        Génère un plan d'entraînement détaillé pour chaque semaine en respectant les principes d'une progression réaliste :
        - Intensité progressive (augmentation progressive de la charge)
        - Récupération avant la compétition
        - Séances spécifiques adaptées au terrain et au dénivelé
        - Différents types de séances : endurance, fractionné, VMA, récupération, seuil

        Format JSON attendu :
        [
          {
            "semaine": 1,
            "seances": [
              {
                "jour": "Mardi",
                "type": "Endurance",
                "description": "Sortie en endurance fondamentale à 70% de la FCM, 45 minutes",
                "echauffement": "15 min footing en zone 2",
                "recuperation": "10 min footing en zone 1",
                "fc_cible": "Zone 2 - 65-75%",
                "zone_fc": "Zone 2 - Endurance",
                "duration": 45
              },
              ...
            ]
          },
          ...
        ]
        `;

        console.log("📌 Envoi de la requête à OpenAI...");
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: prompt }],
            temperature: 0.7
        });

        console.log("✅ Réponse reçue de l'IA");

        const plan = JSON.parse(response.choices[0].message.content);

        console.log(`📌 ${plan.length} semaines générées`);

        // 🔹 Suppression des anciens entraînements générés
        await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

        // 🔹 Insertion du plan en base
        for (const semaine of plan) {
            for (const seance of semaine.seances) {
                await db.query(
                    `INSERT INTO trainings 
                    (user_id, date, type, details, echauffement, recuperation, fc_cible, zone_fc, duration, is_generated, objectif_id) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        userId,
                        new Date(dateEvent), // On ajustera la date réelle côté frontend
                        seance.type,
                        seance.description,
                        seance.echauffement,
                        seance.recuperation,
                        seance.fc_cible,
                        seance.zone_fc,
                        seance.duration,
                        true,
                        null // À adapter si besoin de lier à un objectif
                    ]
                );
            }
        }

        console.log("✅ Plan inséré en base !");
        return { success: true, plan };

    } catch (error) {
        console.error("❌ Erreur IA :", error);
        return { error: "Erreur lors de la génération IA du plan." };
    }
}

module.exports = generateAIPlan;
