document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("add-objectif").addEventListener("click", ajouterObjectifIntermediaire);
    document.getElementById("training-plan-form").addEventListener("submit", envoyerPlan);
});

// Fonction pour ajouter un objectif intermédiaire
function ajouterObjectifIntermediaire() {
    const container = document.getElementById("objectifs-intermediaires");
    const div = document.createElement("div");
    div.innerHTML = `
        <input type="text" name="objectif-intermediaire-type" placeholder="Type d'objectif">
        <input type="date" name="objectif-intermediaire-date">
        <button type="button" onclick="this.parentNode.remove()">❌ Supprimer</button>
    `;
    container.appendChild(div);
}

// Fonction pour envoyer les données au backend
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
    const joursSelectionnes = Array.from(document.querySelectorAll("input[name='jours']:checked")).map(el => el.value);
    const sortieLongue = document.getElementById("sortie-longue").value;

    const objectifsIntermediaires = Array.from(document.querySelectorAll("#objectifs-intermediaires div")).map(div => ({
        type: div.querySelector("[name='objectif-intermediaire-type']").value,
        date: div.querySelector("[name='objectif-intermediaire-date']").value
    })).filter(obj => obj.type && obj.date);

    if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances
