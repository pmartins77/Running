const fetch = require("node-fetch");

async function generateTrainingPlanAI(data) {
    console.log("📡 Envoi des données à l'IA OpenAI...");
    console.log("🔑 Clé API OpenAI utilisée :", process.env.OPENAI_API_KEY ? "OK" : "NON DÉFINIE");

    const today = new Date();
    const endDate = new Date(data.dateEvent);

    if (isNaN(endDate.getTime())) {
        console.error("❌ Erreur : La date de l'événement est invalide :", data.dateEvent);
        return [];
    }

    const weeksBeforeEvent = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 7));

    const prompt = `
Je suis un coach expert en entraînement running et trail. Mon utilisateur souhaite un plan d'entraînement **complet** pour atteindre son objectif : **${data.objectif}**.

---

### 📌 **Informations utilisateur et contexte**
- **Type de terrain** : ${data.terrain}
- **Dénivelé total de la course** : ${data.deniveleTotal || "Non précisé"} mètres
- **Temps restant avant la course** : ${weeksBeforeEvent} semaines
- **Fréquence d'entraînement** : ${data.nbSeances} séances par semaine (${data.joursSelectionnes.join(", ")})
- **Jour de la sortie longue** : ${data.sortieLongue || "Non précisé"}

---

### 📌 **Objectif du plan**
- Le plan doit couvrir **toutes les semaines** jusqu'à la course.
- Il doit inclure **${weeksBeforeEvent * data.nbSeances} séances** au total.
- Les séances doivent être équilibrées avec des sorties longues, du fractionné et de la récupération.

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
Réponds **exclusivement en JSON**, sans texte supplémentaire. La structure doit respecter ce format :

\`\`\`json
[
  {
    "date": "YYYY-MM-DD",
    "type": "Endurance",
    "intensite": "Modérée",
    "duree": 60,
    "echauffement": "15 min footing en zone 2",
    "recuperation": "10 min footing en zone 1",
    "fc_cible": "Zone 2 - Aérobie (65-75%)",
    "details": "Séance d’endurance fondamentale visant à renforcer l’aérobie.",
    "objectif_intermediaire": false
  }
]
\`\`\`

### 📌 **Génère maintenant le plan en respectant ces contraintes.**`;

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

        if (!result.choices || !result.choices[0].message || !result.choices[0].message.content) {
            throw new Error("Réponse vide ou mal formattée de l'IA");
        }

        let aiResponse = result.choices[0].message.content.trim();

        aiResponse = aiResponse.replace(/^```json\s*/, "").replace(/```$/, "");

        console.log("📩 Réponse nettoyée OpenAI :", aiResponse);

        let trainingPlan = JSON.parse(aiResponse);

        const targetYear = new Date(data.dateEvent).getFullYear();
        trainingPlan = trainingPlan.map(seance => {
            const seanceDate = new Date(seance.date);
            seanceDate.setFullYear(targetYear);
            seance.date = seanceDate.toISOString().split("T")[0];
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
