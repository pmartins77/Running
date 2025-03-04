document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("add-objectif").addEventListener("click", ajouterObjectifIntermediaire);
    document.getElementById("training-plan-form").addEventListener("submit", envoyerPlan);
});

async function envoyerPlan(event) {
    event.preventDefault();

    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        return;
    }

    const planData = {
        objectif: document.getElementById("objectif").value,
        objectifAutre: document.getElementById("objectif-autre").value,
        intensite: document.getElementById("intensite").value,
        terrain: document.getElementById("terrain").value,
        dateEvent: document.getElementById("date-event").value,
        nbSeances: parseInt(document.getElementById("nb-seances").value),
        deniveleTotal: parseInt(document.getElementById("denivele").value) || 0,
        joursSelectionnes: Array.from(document.querySelectorAll("input[name='jours']:checked")).map(el => el.value),
        sortieLongue: document.getElementById("sortie-longue").value
    };

    try {
        console.log("📌 Envoi des données pour génération du plan...");
        const response = await fetch("/api/plan/generate", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(planData)
        });

        const data = await response.json();
        if (data.success) {
            alert("✅ Plan généré avec succès !");
            window.location.href = "index.html";
        } else {
            alert("❌ Erreur lors de la génération du plan.");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        alert("Erreur lors de la génération du plan.");
    }
}
