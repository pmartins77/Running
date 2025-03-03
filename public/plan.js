document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("training-plan-form").addEventListener("submit", async (event) => {
        event.preventDefault(); // Empêche le rechargement de la page

        const token = localStorage.getItem("jwt");
        if (!token) {
            alert("Vous devez être connecté !");
            return;
        }

        // Récupération des valeurs du formulaire
        const objectif = document.getElementById("objectif").value;
        const intensite = document.getElementById("intensite").value;
        const terrain = document.getElementById("terrain").value;
        const dateEvent = document.getElementById("date-event").value;
        const nbSeances = parseInt(document.getElementById("nb-seances").value);
        const joursSelectionnes = Array.from(document.querySelectorAll("input[name='jours']:checked")).map(el => el.value);
        const sortieLongue = document.getElementById("sortie-longue").value;

        // Vérification des champs obligatoires
        if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances || joursSelectionnes.length === 0 || !sortieLongue) {
            alert("Veuillez remplir tous les champs !");
            return;
        }

        // Vérification de la cohérence de l'objectif
        if (objectif === "marathon" && nbSeances < 3) {
            alert("Un marathon nécessite au moins 3 entraînements par semaine !");
            return;
        }
        if (objectif === "ultra" && nbSeances < 4) {
            alert("Un ultra nécessite au moins 4 entraînements par semaine !");
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
                body: JSON.stringify({ objectif, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue })
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
    });
});
