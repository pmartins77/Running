const fetch = require("node-fetch");

async function generateTrainingPlanAI(data) {
    console.log("📡 Envoi des données à l'IA...");

    const today = new Date();
    const endDate = new Date(data.dateEvent);
    const weeksBeforeEvent = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 7));

    const prompt = `
Je suis un coach expert en entraînement running et trail. Mon utilisateur souhaite un plan d'entraînement **personnalisé** pour atteindre son objectif : **${data.objectif}**.

---

### 📌 **Informations utilisateur et contexte**
- **Type de terrain** : ${data.deniveleTotal > 0 ? "Trail (avec dénivelé)" : "Route (terrain plat)"}
- **Dénivelé total de la course** : ${data.deniveleTotal} mètres
- **Temps restant avant la course** : ${weeksBeforeEvent} semaines (du ${today.toISOString().split("T")[0]} au ${endDate.toISOString().split("T")[0]})
- **Fréquence d'entraînement** : ${data.nbSeances} séances par semaine (${data.joursSelectionnes.join(", ")})
- **Jour de la sortie longue** : ${data.sortieLongue}
- **Objectifs intermédiaires** : 
  ${data.objectifsIntermediaires.length > 0 ? data.objectifsIntermediaires.map(obj => `- ${obj.type} le ${obj.date}`).join("\n  ") : "Aucun"}

---

### 📌 **Format de réponse attendu (JSON uniquement)**
Réponds **exclusivement en JSON**, sans texte supplémentaire. Structure du JSON :

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

Génère un plan complet et cohérent selon ces instructions.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
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

        // Vérification que la réponse de l'IA contient bien un JSON
        if (!result.choices || !result.choices[0].message || !result.choices[0].message.content) {
            throw new Error("Réponse vide ou mal formattée de l'IA");
        }

        const aiResponse = result.choices[0].message.content;

        console.log("✅ Réponse de l'IA reçue !");
        
        // Vérification que la réponse est bien un JSON valide
        return JSON.parse(aiResponse);
    } catch (error) {
        console.error("❌ Erreur lors de l'appel à l'IA :", error);
        return [];
    }
}

module.exports = generateTrainingPlanAI;
