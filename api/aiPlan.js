const fetch = require("node-fetch");

async function generateTrainingPlanAI(data) {
    console.log("📡 Envoi des données à l'IA...");
    console.log("📌 Données reçues :", data);

    if (!data.dateEvent) {
        console.error("❌ Erreur : `dateEvent` est manquant.");
        throw new Error("`dateEvent` est requis pour générer le plan.");
    }

    const today = new Date();
    const endDate = new Date(data.dateEvent);

    // Vérification de la validité de la date
    if (isNaN(endDate.getTime())) {
        console.error(`❌ Erreur : La date reçue (${data.dateEvent}) est invalide.`);
        throw new Error(`Date d'événement invalide : ${data.dateEvent}`);
    }

    const weeksBeforeEvent = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 7));

    console.log(`📅 Date de l'événement : ${data.dateEvent} (Formaté : ${endDate.toISOString().split("T")[0]})`);
    console.log(`🕒 Temps restant avant l'événement : ${weeksBeforeEvent} semaines`);

    const prompt = `Je suis un coach expert en entraînement running et trail...`;

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
                    { role: "system", content: "Tu es un coach expert en course à pied." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 1024,
                temperature: 0.7,
                n: 1
            })
        });

        const result = await response.json();
        if (!result.choices || !result.choices[0].message || !result.choices[0].message.content) {
            throw new Error("Réponse vide ou mal formattée de l'IA");
        }

        console.log("✅ Réponse de l'IA reçue !");
        return JSON.parse(result.choices[0].message.content);
    } catch (error) {
        console.error("❌ Erreur lors de l'appel à l'IA :", error);
        return [];
    }
}

module.exports = generateTrainingPlanAI;
