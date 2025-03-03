const db = require("./db");

async function generateTrainingPlan(userId) {
    console.log(`📌 Début de la génération du plan pour l'utilisateur ${userId}`);

    // Récupération des préférences utilisateur
    const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (!user.rows.length) {
        console.error("❌ Utilisateur introuvable !");
        throw new Error("Utilisateur introuvable");
    }

    const userData = user.rows[0];
    console.log(`✅ Préférences utilisateur récupérées :`, userData);

    // Récupérer les activités Strava des 60 derniers jours
    const activities = await db.query(
        "SELECT * FROM strava_activities WHERE user_id = $1 ORDER BY date DESC LIMIT 60", 
        [userId]
    );

    console.log(`📌 Nombre d'activités Strava récupérées : ${activities.rows.length}`);

    // Calcul de la durée jusqu'à l'objectif
    const startDate = new Date();
    const endDate = new Date(userData.date_objectif);
    const weeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));

    console.log(`📌 Plan sur ${weeks} semaines jusqu'à l'objectif`);

    // Vider les entraînements générés précédemment
    await db.query("DELETE FROM trainings WHERE user_id = $1 AND is_generated = TRUE", [userId]);

    // Définition des types d'entraînements possibles
    const sessionTypes = [
        { type: "Fractionné", description: "5x1000m à 90% VMA, récup 400m" },
        { type: "Côte", description: "6x200m en montée, récup en descente" },
        { type: "Endurance", description: "Sortie longue à 70% FCM" },
        { type: "Allure spécifique", description: "10km allure marathon" },
        { type: "VMA", description: "10x300m à 95% VMA" },
        { type: "Repos", description: "Journée de récupération" }
    ];

    const trainingPlan = [];
    const fc_moyenne = 150; // Exemple - Peut être calculé dynamiquement

    for (let i = 0; i < weeks; i++) {
        let sessionType = sessionTypes[i % sessionTypes.length];

        trainingPlan.push({
            user_id: userId,
            date: new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000), // Une séance par semaine
            type: sessionType.type,
            duration: sessionType.type === "Repos" ? 0 : 60,
            intensity: sessionType.type === "Repos" ? "Basse" : "Modérée",
            echauffement: sessionType.type === "Repos" ? "Étirements légers" : "15 min footing en zone 2",
            recuperation: sessionType.type === "Repos" ? "Repos complet" : "10 min footing en zone 1",
            fc_cible: `${fc_moyenne - 10} - ${fc_moyenne + 10} BPM`,
            zone_fc: sessionType.type === "Repos" ? "Récupération" : "Zone 3 - Endurance",
            details: sessionType.description,
            is_generated: true
        });
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
