const db = require("./db");

// Définition des types de séances possibles
const TYPES_SEANCES = {
    endurance: "Endurance fondamentale",
    seuil: "Seuil (allure soutenue)",
    vma: "VMA (travail en intensité)",
    fractionne: "Fractionné court/long",
    recuperation: "Sortie récupération"
};

async function genererPlan(userId, params) {
    console.log("📌 Début de la génération de plan pour l'utilisateur :", userId);
    console.log("📊 Paramètres du plan :", params);

    const { objectifsIds, joursSelectionnes, sortieLongue, nbSeances } = params;

    // Récupérer les données Strava pour analyser le niveau de l'utilisateur
    const userStravaData = await db.query(`
        SELECT SUM(distance) as total_km_12semaines, COUNT(*) / 12 as jours_semaine
        FROM strava_activities 
        WHERE user_id = $1 
        AND date >= NOW() - INTERVAL '12 weeks'
    `, [userId]);

    const userData = userStravaData.rows[0];
    console.log("📊 Données Strava analysées :", userData);

    let niveau = evaluerNiveau(userData);
    console.log("✅ Niveau de l'utilisateur :", niveau);

    let plan = [];

    for (let semaine = 1; semaine <= 16; semaine++) {
        let entrainement = { semaine, seances: [] };

        for (let jour of joursSelectionnes) {
            let type = choisirTypeSeance(semaine, niveau);
            entrainement.seances.push({
                jour,
                type,
                vitesse_cible: calculerVitesse(userData, type),
                fc_cible: definirZoneFC(userData, type)
            });
        }
        
        plan.push(entrainement);
    }

    console.log("✅ Plan généré avec succès :", plan);

    // Insérer le plan en base
    try {
        await db.query("DELETE FROM trainings WHERE user_id = $1", [userId]);

        for (let semaine of plan) {
            for (let seance of semaine.seances) {
                await db.query(
                    `INSERT INTO trainings (user_id, date, type, objectif_id) VALUES ($1, $2, $3, $4)`,
                    [userId, new Date(), seance.type, Object.values(objectifsIds)[0]]
                );
            }
        }

        console.log("✅ Plan enregistré en base !");
        return { message: "Plan généré avec succès" };
    } catch (error) {
        console.error("❌ Erreur SQL lors de l'insertion du plan :", error);
        return { error: "Erreur serveur lors de l'insertion du plan." };
    }
}

function evaluerNiveau(user) {
    if (user.total_km_12semaines > 300) return "avancé";
    if (user.total_km_12semaines > 120) return "intermédiaire";
    return "débutant";
}

function choisirTypeSeance(semaine, niveau) {
    if (semaine < 3) return "endurance";
    if (niveau === "avancé") return ["endurance", "vma", "fractionne", "seuil"][Math.floor(Math.random() * 4)];
    return ["endurance", "seuil", "fractionne"][
