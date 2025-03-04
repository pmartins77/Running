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

    const objectif = document.getElementById("objectif").value;
    const objectifAutre = document.getElementById("objectif-autre").value;
    const intensite = document.getElementById("intensite").value;
    const terrain = document.getElementById("terrain").value;
    const dateEvent = document.getElementById("date-event").value;
    const nbSeances = parseInt(document.getElementById("nb-seances").value);
    const deniveleTotal = parseInt(document.getElementById("denivele")?.value) || 0;
    const joursSelectionnes = Array.from(document.querySelectorAll("input[name='jours']:checked")).map(el => el.value);
    const sortieLongue = document.getElementById("sortie-longue").value;

    // ✅ Récupérer les objectifs intermédiaires
    const objectifsIntermediaires = Array.from(document.querySelectorAll(".objectif-intermediaire")).map(div => ({
        type: div.querySelector(".objectif-type").value,
        date: div.querySelector(".objectif-date").value
    })).filter(obj => obj.type && obj.date);

    if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances || joursSelectionnes.length === 0 || !sortieLongue) {
        alert("Veuillez remplir tous les champs !");
        return;
    }

    const planData = {
        objectif, 
        objectifAutre, 
        intensite, 
        terrain, 
        dateEvent, 
        nbSeances, 
        deniveleTotal,
        joursSelectionnes, 
        sortieLongue, 
        objectifsIntermediaires 
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
            window.location.href = "index.html"; // Redirection vers le calendrier
        } else {
            alert("❌ Erreur lors de la génération du plan.");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        alert("Erreur lors de la génération du plan.");
    }
}
