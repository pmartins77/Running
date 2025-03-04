const fetch = require("node-fetch");

async function generateTrainingPlanAI(data) {
    console.log("📡 Envoi des données à l'IA OpenAI...");
    console.log("🔑 Clé API OpenAI utilisée :", process.env.OPENAI_API_KEY ? "OK" : "NON DÉFINIE");

    const today = new Date();
    const endDate = new Date(data.dateEvent);

    // Vérification de la date pour éviter les erreurs `Invalid time value`
    if (isNaN(endDate.getTime())) {
        console.error("❌ Erreur : La date de l'événement est invalide :", data.dateEvent);
        return [];
    }

    const weeksBeforeEvent = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 7));

    const prompt = `
Je suis un coach expert en entraînement running et trail. Mon utilisateur souhaite un plan d'entraînement **personnalisé** pour atteindre son objectif : **${data.objectif}**.

---

### 📌 **Informations utilisateur et contexte**
- **Type de terrain** : ${data.terrain}
- **Dénivelé total de la course** : ${data.deniveleTotal || "Non précisé"} mètres
- **Temps restant avant la course** : ${weeksBeforeEvent} semaines
- **Fréquence d'entraînement** : ${data.nbSeances} séances par semaine (${data.joursSelectionnes.join(", ")})
- **Jour de la sortie longue** : ${data.sortieLongue || "Non précisé"}

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

### 📌 **Maintenant, génère un plan d’entraînement en respectant ces règles.**`;

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
                max_tokens: 1024,
                temperature: 0.7,
                n: 1
            })
        });

        const result = await response.json();
        console.log("📩 Réponse brute OpenAI :", JSON.stringify(result, null, 2));

        // Vérification que la réponse contient bien un JSON valide
        if (!result.choices || !result.choices[0].message || !result.choices[0].message.content) {
            throw new Error("Réponse vide ou mal formattée de l'IA");
        }

        const aiResponse = result.choices[0].message.content.trim(); // Trim pour éviter les espaces invisibles
        console.log("📩 Réponse texte OpenAI :", aiResponse);

        try {
            return JSON.parse(aiResponse);
        } catch (jsonError) {
            console.error("❌ Erreur JSON lors du parsing :", jsonError, "\nRéponse IA brute :", aiResponse);
            return [];
        }

    } catch (error) {
        console.error("❌ Erreur lors de l'appel à l'IA :", error);
        return [];
    }
}

module.exports = generateTrainingPlanAI;
