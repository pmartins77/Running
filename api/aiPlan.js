const openai = require("openai"); // Assurez-vous que la bibliothèque OpenAI est installée
const db = require("./db");

async function generateTrainingPlanAI(userId, trainingData) {
    console.log("📌 Début de la génération du plan via IA pour l'utilisateur :", userId);

    const {
        objectifPrincipalId,
        dateEvent,
        joursSelectionnes,
        sortieLongue,
        nbSeances,
        deniveleTotal,
        objectifsIntermediaires, // 📌 Liste des courses intermédiaires
        VMA,
        FCMax,
        allure5km,
        allure10km,
        allureSemi,
        allureMarathon,
        blessures,
        autresSports,
        contraintes,
        typesSeances,
        nutrition,
        recuperation
    } = trainingData;

    const today = new Date(); // 📅 Début du plan = date actuelle
    const endDate = new Date(dateEvent); // 📅 Fin du plan = date de la course principale
    const weeksBeforeEvent = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 7));

    // 🔹 Création du prompt pour l'IA
    const prompt = `
Je suis un coach expert en entraînement running et trail. Mon utilisateur souhaite un plan d'entraînement personnalisé pour atteindre son objectif de ${nbSeances} séances/semaine.

### Informations clés :
- **Type de terrain** : ${deniveleTotal > 0 ? "Trail" : "Route"}
- **Dénivelé total de la course** : ${deniveleTotal} mètres
- **Durée du plan** : ${weeksBeforeEvent} semaines (${today.toISOString().split("T")[0]} → ${endDate.toISOString().split("T")[0]})
- **Fréquence d'entraînement** : ${nbSeances} séances par semaine (${joursSelectionnes.join(", ")})
- **Jour de la sortie longue** : ${sortieLongue}
- **Objectifs intermédiaires** :
  ${objectifsIntermediaires.length > 0 
      ? objectifsIntermediaires.map(obj => `- ${obj.type} le ${obj.date}`).join("\n  ") 
      : "Aucun"}

### Personnalisation selon le profil :
- **VMA** : ${VMA ? VMA + " km/h" : "Non connue, estimez-la en fonction de l'âge"}
- **FC Max** : ${FCMax ? FCMax + " bpm" : "Non connue"}
- **Allures de référence** : 
  - 5 km : ${allure5km ? allure5km : "Non connue"}
  - 10 km : ${allure10km ? allure10km : "Non connue"}
  - Semi-marathon : ${allureSemi ? allureSemi : "Non connue"}
  - Marathon : ${allureMarathon ? allureMarathon : "Non connue"}
- **Blessures passées** : ${blessures ? blessures : "Aucune"}
- **Autres sports pratiqués** : ${autresSports ? autresSports : "Aucun"}
- **Contraintes personnelles** : ${contraintes ? contraintes : "Aucune"}
- **Recommandations nutritionnelles** : ${nutrition ? nutrition : "Non précisées"}
- **Méthodes de récupération privilégiées** : ${recuperation ? recuperation : "Non précisées"}

### Structure de l'entraînement :
1. **Progression optimisée** :
   - Augmentation progressive de la charge pour éviter les blessures.
   - Alternance entre phases de charge et récupération.
   - Réduction progressive de la charge avant les courses intermédiaires et l’objectif final.

2. **Prise en compte des courses intermédiaires** :
   - **Réduction de charge avant une course** pour arriver en forme.
   - **Récupération après une course** pour éviter la fatigue excessive.
   - **Intégration des courses comme des séances clés**.

3. **Séances spécifiques adaptées** :
   - **Endurance fondamentale** : consolidation de l’aérobie.
   - **Fractionné/VMA** : amélioration de la puissance et de l’économie de course.
   - **Seuil anaérobie** : optimisation de la gestion de l’effort prolongé.
   - **Côtes et renforcement musculaire** : préparation spécifique au dénivelé.
   - **Sorties longues** : développement de l’endurance et de la résistance mentale.

### Résultat attendu :
Génère un plan d'entraînement hebdomadaire détaillé, en précisant pour chaque jour :
- Type de séance (endurance, fractionné, seuil…)
- Intensité (% VMA ou zones cardiaques)
- Durée et volume total
- Conseils spécifiques pour l'efficacité et la récupération
- **Adaptations en fonction des courses intermédiaires** (réduction de charge et récupération)
Le plan doit être structuré, progressif et adapté au niveau de l’utilisateur.
    `;

    try {
        console.log("📌 Envoi du prompt à l'IA...");
        const response = await openai.Completion.create({
            model: "gpt-4",
            prompt: prompt,
            max_tokens: 1500
        });

        const generatedPlan = response.choices[0].text.trim();
        console.log("✅ Réponse IA reçue :", generatedPlan);

        // 🔹 Enregistrement du plan en base de données
        console.log("📌 Enregistrement du plan en base de données...");
        const planArray = generatedPlan.split("\n\n");

        for (const session of planArray) {
            const [date, type, intensity, duration, details] = session.split("\n").map(line => line.trim());

            if (!date || !type) continue; // Éviter d'insérer des lignes vides

            await db.query(
                `INSERT INTO trainings (user_id, date, type, intensity, duration, details, objectif_id, is_generated) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
                [userId, new Date(date), type, intensity, duration, details, objectifPrincipalId]
            );
        }

        console.log("✅ Plan inséré en base !");
        return { success: true, plan: generatedPlan };

    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan avec IA :", error);
        return { success: false, error: "Erreur lors de la génération du plan." };
    }
}

module.exports = generateTrainingPlanAI;
