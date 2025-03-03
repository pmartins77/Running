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

        // Récupération des objectifs intermédiaires
        const intermediaires = [];
        document.querySelectorAll(".intermediaire-row").forEach(row => {
            const interType = row.querySelector(".inter-type").value;
            const interDate = row.querySelector(".inter-date").value;
            if (interType && interDate) {
                intermediaires.push({ type: interType, date: interDate });
            }
        });

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
                body: JSON.stringify({ objectif, intensite, terrain, dateEvent, nbSeances, joursSelectionnes, sortieLongue, intermediaires })
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

    // Gestion dynamique des objectifs intermédiaires
    document.getElementById("add-intermediaire").addEventListener("click", () => {
        const container = document.getElementById("intermediaires-container");
        const newRow = document.createElement("div");
        newRow.classList.add("intermediaire-row");
        newRow.innerHTML = `
            <input type="date" class="inter-date" required>
            <select class="inter-type">
                <option value="">Sélectionner une course</option>
                <option value="5km">5 km</option>
                <option value="10km">10 km</option>
                <option value="15km">15 km</option>
                <option value="20km">20 km</option>
                <option value="semi">Semi-marathon</option>
                <option value="marathon">Marathon</option>
                <option value="100km">100 km</option>
                <option value="autre">Autre</option>
            </select>
            <button type="button" class="remove-intermediaire">❌</button>
        `;
        container.appendChild(newRow);

        // Suppression de l'objectif intermédiaire ajouté
        newRow.querySelector(".remove-intermediaire").addEventListener("click", () => {
            container.removeChild(newRow);
        });
    });
});
