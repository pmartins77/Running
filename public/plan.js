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
        objectif: document.getElementById("objectif")?.value || "",
        objectifAutre: document.getElementById("objectif-autre")?.value || "",
        intensite: document.getElementById("intensite")?.value || "",
        terrain: document.getElementById("terrain")?.value || "",
        dateEvent: document.getElementById("date-event")?.value || "",
        nbSeances: parseInt(document.getElementById("nb-seances")?.value) || 0,
        deniveleTotal: parseInt(document.getElementById("denivele")?.value) || 0,
        joursSelectionnes: Array.from(document.querySelectorAll("input[name='jours']:checked")).map(el => el.value),
        sortieLongue: document.getElementById("sortie-longue")?.value || "",
        blessures: document.getElementById("blessures")?.value || "",
        contraintes: document.getElementById("contraintes")?.value || "",
    };

    if (!planData.objectif || !planData.intensite || !planData.terrain || !planData.dateEvent || planData.nbSeances <= 0 || planData.joursSelectionnes.length === 0) {
        alert("Veuillez remplir tous les champs obligatoires !");
        return;
    }

    // Envoi au backend
    await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(planData)
    });

    alert("✅ Plan généré avec succès !");
    window.location.href = "index.html";
}
