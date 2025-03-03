document.getElementById("generate-plan").addEventListener("click", async () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        return;
    }

    // Demander à l'utilisateur ses préférences
    const objectif = prompt("Quel est votre objectif ? (ex: Marathon, Semi, 10km)");
    const intensite = prompt("Souhaitez-vous un entraînement conservateur, équilibré ou ambitieux ?");

    if (!objectif || !intensite) {
        alert("Veuillez renseigner un objectif et une intensité.");
        return;
    }

    try {
        console.log("📌 Demande de génération du plan d'entraînement...");

        const response = await fetch("/api/plan/generate", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ objectif, intensite })
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la génération du plan.");
        }

        const data = await response.json();
        if (data.success) {
            alert("✅ Plan d'entraînement généré avec succès !");
            loadCalendar(); // Recharge la liste après génération
        } else {
            alert("❌ Erreur lors de la génération du plan.");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        alert("Erreur lors de la génération du plan.");
    }
});
