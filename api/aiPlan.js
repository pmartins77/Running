const { spawn } = require("child_process");

async function generateTrainingPlanAI(data) {
    console.log("📡 Envoi des données à l'IA locale...");

    const today = new Date();
    const endDate = new Date(data.dateEvent);
    const weeksBeforeEvent = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 7));

    const prompt = `
Je suis un coach expert en entraînement running et trail. Mon utilisateur souhaite un plan d'entraînement **personnalisé** pour atteindre son objectif : **${data.objectif}**.

---

### 📌 **Informations utilisateur et contexte**
- **Type de terrain** : ${data.deniveleTotal > 0 ? "Trail (avec dénivelé)" : "Route (terrain plat)"}
- **Dénivelé total de la course** : ${data.deniveleTotal} mètres
- **Temps restant avant la course** : ${weeksBeforeEvent} semaines
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
        return new Promise((resolve, reject) => {
            const process = spawn("python3", ["./ai/generate_plan.py", prompt]);

            let output = "";
            process.stdout.on("data", (data) => {
                output += data.toString();
            });

            process.stderr.on("data", (data) => {
                console.error("❌ Erreur IA :", data.toString());
            });

            process.on("close", (code) => {
                if (code !== 0) {
                    reject(new Error("L'IA a retourné une erreur."));
                }
                try {
                    const parsedData = JSON.parse(output);
                    console.log("✅ Réponse de l'IA reçue !");
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error("Réponse mal formatée de l'IA."));
                }
            });
        });
    } catch (error) {
        console.error("❌ Erreur lors de l'appel à l'IA :", error);
        return [];
    }
}

module.exports = generateTrainingPlanAI;
