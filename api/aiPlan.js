const fetch = require("node-fetch");

async function generateTrainingPlanAI(data, stravaActivities) {
    console.log("📡 Envoi des données à l'IA OpenAI...");
    console.log("🔑 Clé API OpenAI utilisée :", process.env.OPENAI_API_KEY ? "OK" : "NON DÉFINIE");

    const today = new Date();
    const endDate = new Date(data.dateEvent);

    if (isNaN(endDate.getTime())) {
        console.error("❌ Erreur : La date de l'événement est invalide :", data.dateEvent);
        return [];
    }

    const weeksBeforeEvent = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 7));
    const totalSessions = weeksBeforeEvent * parseInt(data.nbSeances, 10);

    // ✅ Filtrage des 30 dernières activités Strava (en course uniquement)
    const runningActivities = stravaActivities
        .filter(activity => activity.type.toLowerCase().includes("run"))
        .slice(0, 30);

    const stravaSummary = runningActivities.length > 0
        ? JSON.stringify(runningActivities, null, 2)
        : "Aucune activité récente enregistrée.";

    const prompt = `
Je suis un coach expert en entraînement running et trail. Mon utilisateur souhaite un plan d'entraînement **complet** pour atteindre son objectif : **${data.objectif}**.

---

### 📌 **Informations utilisateur et contexte**
- **Date de début du plan** : ${today.toISOString().split("T")[0]}
- **Date de l'événement cible** : ${data.dateEvent}
- **Type de terrain** : ${data.terrain}
- **Temps restant avant la course** : ${weeksBeforeEvent} semaines
- **Fréquence d'entraînement** : ${data.nbSeances} séances par semaine (${data.joursSelectionnes.join(", ")})
- **Jour de la sortie longue** : ${data.sortieLongue || "Non précisé"} (doit être un jour d'entraînement possible)
- **Historique des 30 dernières séances de l'athlète via Strava** :
\`\`\`
${stravaSummary}
\`\`\`

---

### 📌 **Objectif du plan**
- **Le plan doit couvrir toute la période du ${today.toISOString().split("T")[0]} au ${data.dateEvent}.**
- **Il doit inclure exactement ${totalSessions} séances.**
- **Les séances doivent être bien réparties sur cette période avec des sorties longues, du fractionné et des séances de récupération.**
- **Ne pas inclure d'entraînements en vélo ou en natation.**

---

### 📌 **Profil de l'athlète**
- **Vitesse Maximale Aérobie (VMA)** : ${data.vma || "À estimer"}
- **Fréquence Cardiaque Maximale (FC Max)** : ${data.fcMax || "À estimer"}
- **Allures de référence** : ${data.allures ? JSON.stringify(data.allures) : "Non fournies"}
- **Blessures passées** : ${data.blessures || "Aucune"}
- **Autres sports pratiqués** : ${data.autresSports || "Aucun"}
- **Contraintes personnelles** : ${data.contraintes || "Aucune"}
- **Recommandations nutritionnelles** : ${data.nutrition || "Non précisées"}
- **Méthodes de récupération privilégiées** : ${data.recuperation || "Non précisées"}

---

### 📌 **Format de réponse attendu (JSON uniquement)**
Réponds **exclusivement en JSON**, sans texte supplémentaire, balises Markdown ni commentaires.

[
  {
    "date": "YYYY-MM-DD",
    "type": "Endurance",
    "intensite": "Modérée",
    "duree": 60,
    "echauffement": "15 min footing en zone 2",
    "recuperation": "10 min footing en zone 1",
    "fc_cible": {
      "echauffement": "Zone 2 - Aérobie (65-75%)",
      "exercice": "Zone 3 - Seuil Anaérobie (80-85%)",
      "recuperation": "Zone 1 - Récupération (55-65%)"
    },
    "details": {
      "objectif": "Renforcement de l’aérobie",
      "contenu": "Footing de 45 min en zone 2, suivi de 3 accélérations progressives de 30 secondes.",
      "durée_totale": 60,
      "durée_exercice": 35
    },
    "conseil_journalier": "Aujourd’hui, pensez à bien vous hydrater et à tester une boisson énergétique en prévision du jour de course."
  }
]

### 📌 **Génère maintenant le plan en respectant ces contraintes strictes.**`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Tu es un coach expert en course à pied et en trail. Génère un plan d'entraînement personnalisé basé sur les informations suivantes." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 4096,
                temperature: 0.7,
                n: 1
            })
        });

        const result = await response.json();
        console.log("📩 Réponse brute OpenAI :", JSON.stringify(result, null, 2));

        let aiResponse = result.choices[0]?.message?.content?.trim() || "";

        aiResponse = aiResponse.replace(/^```json\s*/, "").replace(/```$/, "");

        let trainingPlan = JSON.parse(aiResponse);

        // ✅ Correction des dates générées pour être bien dans la période demandée
        trainingPlan = trainingPlan.map(seance => {
            const seanceDate = new Date(seance.date);
            if (!isNaN(seanceDate.getTime()) && seanceDate >= today && seanceDate <= endDate) {
                seanceDate.setFullYear(today.getFullYear());
                seance.date = seanceDate.toISOString().split("T")[0];
            }
            return seance;
        });

        console.log("📆 Plan corrigé avec dates ajustées :", trainingPlan);

        return trainingPlan;

    } catch (error) {
        console.error("❌ Erreur lors de l'appel à l'IA :", error);
        return [];
    }
}

module.exports = generateTrainingPlanAI;
