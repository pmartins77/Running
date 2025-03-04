const fetch = require("node-fetch");

async function generateTrainingPlanAI(data) {
    console.log("📡 Envoi des données à l'IA...");

    if (!data.dateEvent) {
        throw new Error("❌ Erreur : `dateEvent` est manquant !");
    }

    const today = new Date();
    const endDate = new Date(data.dateEvent);

    if (isNaN(endDate.getTime())) {
        throw new Error(`❌ Erreur : dateEvent (${data.dateEvent}) n'est pas une date valide !`);
    }

    const weeksBeforeEvent = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 7));

    const prompt = `
        Je suis un coach expert en entraînement running...
        - **Date de l'événement** : ${data.dateEvent} (${endDate.toISOString().split("T")[0]})
    `;

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
                    { role: "system", content: "Tu es un coach expert en course à pied et en trail." },
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
