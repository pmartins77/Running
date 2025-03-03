const db = require("./db");

// Définition des types de séances possibles
const TYPES_SEANCES = {
    endurance: "Endurance fondamentale",
    seuil: "Seuil (allure soutenue)",
    vma: "VMA (travail en intensité)",
    fractionne: "Fractionné court/long",
    recuperation: "Sortie récupération"
};

function genererPlan(user, objectif) {
    let plan = [];
    let niveau = evaluerNiveau(user);
    
    // Vérification si l'objectif est réaliste
    if (!objectifEstRealiste(user, objectif)) {
        return { error: "Objectif irréalisable avec votre niveau et disponibilité." };
    }

    for (let semaine = 1; semaine <= objectif.duree_semaines; semaine++) {
        let entrainement = { semaine, seances: [] };

        for (let jour of objectif.jours_seances) {
            let type = choisirTypeSeance(semaine, objectif, niveau);
            entrainement.seances.push({
                jour,
                type,
                vitesse_cible: calculerVitesse(user, type),
                fc_cible: definirZoneFC(user, type)
            });
        }
        
        plan.push(entrainement);
    }

    return plan;
}

function evaluerNiveau(user) {
    if (user.total_km_6semaines > 150) return "avancé";
    if (user.total_km_6semaines > 60) return "intermédiaire";
    return "débutant";
}

function objectifEstRealiste(user, objectif) {
    if (objectif.distance === "marathon" && user.jours_semaine < 3) return false;
    if (objectif.distance === "semi" && user.jours_semaine < 2) return false;
    return true;
}

function choisirTypeSeance(semaine, objectif, niveau) {
    if (semaine < 3) return "endurance";
    if (niveau === "avancé") return ["endurance", "vma", "fractionne", "seuil"][Math.floor(Math.random() * 4)];
    return ["endurance", "seuil", "fractionne"][Math.floor(Math.random() * 3)];
}

function calculerVitesse(user, type) {
    if (type === "endurance") return user.allure_moyenne * 1.1;
    if (type === "seuil") return user.allure_moyenne * 0.9;
    if (type === "vma") return user.allure_moyenne * 0.8;
    return user.allure_moyenne;
}

function definirZoneFC(user, type) {
    if (type === "endurance") return "65-75%";
    if (type === "seuil") return "80-90%";
    if (type === "vma") return "90-100%";
    return "50-60%";
}

module.exports = genererPlan;
