async function generatePlan(event) {
    event.preventDefault();

    const joursSelectionnes = [...document.querySelectorAll("input[type=checkbox]:checked")].map(e => e.value);
    const objectif = document.getElementById("objectif").value;
    const intensiteInput = document.getElementById("intensite").value.toLowerCase();
    const terrain = document.getElementById("terrain").value;
    const dateEvent = document.getElementById("dateEvent").value;
    const nbSeances = document.getElementById("nbSeances").value;
    const sortieLongue = document.getElementById("sortieLongue").value;
    const vma = document.getElementById("vma").value || null;
    const fcMax = document.getElementById("fcMax").value || null;
    const allures = document.getElementById("allures").value ? JSON.parse(document.getElementById("allures").value) : null;
    const blessures = document.getElementById("blessures").value || null;
    const autresSports = document.getElementById("autresSports").value || null;
    const contraintes = document.getElementById("contraintes").value || null;
    const nutrition = document.getElementById("nutrition").value || null;
    const recuperation = document.getElementById("recuperation").value || null;

    let intensiteCorrigee;
    switch (intensiteInput) {
        case "faible":
            intensiteCorrigee = "conservateur";
            break;
        case "modérée":
            intensiteCorrigee = "équilibré";
            break;
        case "élevée":
            intensiteCorrigee = "ambitieux";
            break;
        default:
            intensiteCorrigee = "équilibré";
    }

    const payload = {
        objectif,
        intensite: intensiteCorrigee,
        terrain,
        dateEvent,
        nbSeances,
        joursSelectionnes,
        sortieLongue,
        vma,
        fcMax,
        allures,
        blessures,
        autresSports,
        contraintes,
        nutrition,
        recuperation
    };

    try {
        const response = await fetch("/api/plan/generate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("jwt")}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ Plan généré avec succès !");
        } else {
            alert("❌ Erreur lors de la génération : " + data.error);
        }
    } catch (error) {
        console.error("❌ Erreur :", error);
        alert("❌ Problème de connexion au serveur.");
    }
}
