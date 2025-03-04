const fetch = require("node-fetch");

async function generateTrainingPlanAI(data) {
    console.log("📡 Envoi des données à l'IA gratuite...");

    const today = new Date();
    const endDate = new Date(data.dateEvent);
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
        const response = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-cnn", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { max_length: 1024, temperature: 0.7 },
            })
        });

        const result = await response.json();

        // Vérification que la réponse de l'IA contient bien un JSON
        if (!result || !result[0] || !result[0].generated_text) {
            throw new Error("Réponse vide ou mal formatée de l'IA");
        }

        const aiResponse = result[0].generated_text;

        console.log("✅ Réponse de l'IA reçue !");
        
        // Vérification que la réponse est bien un JSON valide
        return JSON.parse(aiResponse);
    } catch (error) {
        console.error("❌ Erreur lors de l'appel à l'IA :", error);
        return [];
    }
}

module.exports = generateTrainingPlanAI;
