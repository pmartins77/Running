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
        const objectifAutre = document.getElementById("objectif-autre").value;
        const intensite = document.getElementById("intensite").value;
        const terrain = document.getElementById("terrain").value;
        const dateEvent = document.getElementById("date-event").value;
        const nbSeances = parseInt(document.getElementById("nb-seances").value);
        const joursSelectionnes = Array.from(document.querySelectorAll("input[name='jours']:checked")).map(el => el.value);
        const sortieLongue = document.getElementById("sortie-longue").value;

        // Objectifs intermédiaires
        let objectifsIntermediaires = [];
        document.querySelectorAll(".objectif-intermediaire").forEach(div => {
            const type = div.querySelector(".objectif-type").value;
            const date = div.querySelector(".objectif-date").value;
            if (type && date) {
                objectifsIntermediaires.push({ type, date });
            }
        });

        console.log("📌 Données envoyées :", {
            objectif, objectifAutre, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue, objectifsIntermediaires
        });

        try {
            const response = await fetch("/api/plan/generate", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ objectif, objectifAutre, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue, objectifsIntermediaires })
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
        }
    });

    // Ajouter un objectif intermédiaire
    document.getElementById("add-objectif-intermediaire").addEventListener("click", () => {
        const container = document.getElementById("objectifs-intermediaires");
        const div = document.createElement("div");
        div.classList.add("objectif-intermediaire");
        div.innerHTML = `<input type="text" class="objectif-type" placeholder="Type d'objectif"><input type="date" class="objectif-date"><button type="button" onclick="this.parentNode.remove()">❌</button>`;
        container.appendChild(div);
    });
});
