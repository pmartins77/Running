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

    // 🔹 Vérifier que tous les paramètres sont bien définis
    if (!userId || !objectifsIds || !joursSelectionnes || !sortieLongue || !nbSeances) {
        console.error("❌ Paramètres invalides pour la génération du plan !");
        return { error: "Données invalides" };
    }

    // 🔹 Récupérer les données Strava sur 12 semaines
    try {
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

        // 🔹 Insérer le plan en base avec les bonnes dates et toutes les infos
        try {
            await db.query("DELETE FROM trainings WHERE user_id = $1", [userId]);

            for (let semaine of plan) {
                for (let seance of semaine.seances) {
                    const dateSeance = calculerDateSeance(objectifsIds, semaine, seance.jour);
                    console.log(`📅 Insertion de la séance : ${seance.type} pour le ${dateSeance}`);

                    await db.query(
                        `INSERT INTO trainings (user_id, date, type, duration, intensity, fc_cible, zone_fc, objectif_id) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            userId,
                            dateSeance,
                            seance.type,
                            60,  // 🔹 Valeur fictive pour la durée (1h), à adapter
                            "Moyenne", // 🔹 Ajouter une logique pour l'intensité
                            seance.fc_cible,
                            definirZoneFC(userData, seance.type),
                            Object.values(objectifsIds)[0]
                        ]
                    );
                }
            }

            console.log("✅ Plan enregistré en base avec toutes les données !");
            return { message: "Plan généré avec succès" };
        } catch (error) {
            console.error("❌ Erreur SQL lors de l'insertion du plan :", error);
            return { error: "Erreur serveur lors de l'insertion du plan." };
        }
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données Strava :", error);
        return { error: "Erreur serveur lors de l'analyse des performances." };
    }
}

// 🔹 Fonction pour calculer la date de chaque séance
function calculerDateSeance(objectifsIds, semaine, jour) {
    const dateDebut = new Date(Object.keys(objectifsIds)[0]); // Récupère la date du premier objectif
    dateDebut.setDate(dateDebut.getDate() - (16 - semaine) * 7); // Détermine la semaine d'entraînement
    const joursCorrespondance = {
        "Lundi": 1, "Mardi": 2, "Mercredi": 3, "Jeudi": 4, "Vendredi": 5, "Samedi": 6, "Dimanche": 7
    };
    const jourNum = joursCorrespondance[jour] || 1;
    dateDebut.setDate(dateDebut.getDate() + (jourNum - dateDebut.getDay())); // Ajuste au bon jour
    return dateDebut;
}

// 🔹 Évaluation du niveau de l'utilisateur
function evaluerNiveau(user) {
    if (!user || !user.total_km_12semaines) return "débutant";
    if (user.total_km_12semaines > 300) return "avancé";
    if (user.total_km_12semaines > 120) return "intermédiaire";
    return "débutant";
}

// 🔹 Sélection du type de séance
function choisirTypeSeance(semaine, niveau) {
    if (semaine < 3) return "endurance";
    if (niveau === "avancé") return ["endurance", "vma", "fractionne", "seuil"][Math.floor(Math.random() * 4)];
    return ["endurance", "seuil", "fractionne"][Math.floor(Math.random() * 3)];
}

// 🔹 Calcul de la vitesse cible
function calculerVitesse(user, type) {
    if (!user || !user.total_km_12semaines) return null;
    const baseVitesse = user.total_km_12semaines / 12;
    if (type === "endurance") return baseVitesse * 1.1;
    if (type === "seuil") return baseVitesse * 0.9;
    if (type === "vma") return baseVitesse * 0.8;
    return baseVitesse;
}

// 🔹 Définition de la fréquence cardiaque cible
function definirZoneFC(user, type) {
    if (type === "endurance") return "65-75%";
    if (type === "seuil") return "80-90%";
    if (type === "vma") return "90-100%";
    return "50-60%";
}

module.exports = genererPlan;
