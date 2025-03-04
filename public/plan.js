document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("add-objectif").addEventListener("click", ajouterObjectifIntermediaire);
    document.getElementById("training-plan-form").addEventListener("submit", envoyerPlan);
});

// ✅ Fonction pour ajouter un objectif intermédiaire
function ajouterObjectifIntermediaire() {
    const container = document.getElementById("objectifs-intermediaires");
    const div = document.createElement("div");
    div.classList.add("objectif-intermediaire");
    div.innerHTML = `
        <input type="text" class="objectif-type" placeholder="Type d'objectif" required>
        <input type="date" class="objectif-date" required>
        <button type="button" onclick="this.parentNode.remove()">❌ Supprimer</button>
    `;
    container.appendChild(div);
}

// ✅ Fonction pour envoyer les données au backend
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
        sortieLongue: document.getElementById("sortie-longue").value,
        VMA: parseFloat(document.getElementById("VMA").value) || null,
        FCMax: parseInt(document.getElementById("FCMax").value) || null,
        allure5km: document.getElementById("allure5km").value || null,
        allure10km: document.getElementById("allure10km").value || null,
        allureSemi: document.getElementById("allureSemi").value || null,
        allureMarathon: document.getElementById("allureMarathon").value || null,
        blessures: document.getElementById("blessures").value || null,
        autresSports: document.getElementById("autresSports").value || null,
        contraintes: document.getElementById("contraintes").value || null,
        typesSeances: document.getElementById("typesSeances").value || null,
        nutrition: document.getElementById("nutrition").value || null,
        recuperation: document.getElementById("recuperation").value || null,
        objectifsIntermediaires: Array.from(document.querySelectorAll(".objectif-intermediaire")).map(div => ({
            type: div.querySelector(".objectif-type").value,
            date: div.querySelector(".objectif-date").value
        })).filter(obj => obj.type && obj.date)
    };

    if (!planData.objectif || !planData.intensite || !planData.terrain || !planData.dateEvent || !planData.nbSeances || planData.joursSelectionnes.length === 0 || !planData.sortieLongue) {
        alert("Veuillez remplir tous les champs !");
        return;
    }

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
            window.location.href = "index.html"; // Redirection vers le calendrier
        } else {
            alert("❌ Erreur lors de la génération du plan.");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        alert("Erreur lors de la génération du plan.");
    }
}
