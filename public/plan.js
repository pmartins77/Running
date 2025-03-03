document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("training-plan-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("jwt");
        if (!token) {
            alert("Vous devez être connecté !");
            return;
        }

        const objectif = document.getElementById("objectif").value;
        const intensite = document.getElementById("intensite").value;
        const terrain = document.getElementById("terrain").value;
        const dateEvent = document.getElementById("date-event").value;
        const nbSeances = parseInt(document.getElementById("nb-seances").value);
        const joursSelectionnes = Array.from(document.querySelectorAll("input[name='jours']:checked")).map(el => el.value);
        const sortieLongue = document.getElementById("sortie-longue").value;

        let objectifAutre = "";
        if (objectif === "autre") {
            objectifAutre = document.getElementById("objectif-autre").value;
        }

        // Vérification des objectifs intermédiaires
        const objectifsIntermediaires = [];
        document.querySelectorAll(".objectif-intermediaire").forEach(div => {
            const type = div.querySelector(".type-objectif").value;
            const date = div.querySelector(".date-objectif").value;
            if (type && date) {
                objectifsIntermediaires.push({ type, date });
            }
        });

        if (!objectif || !intensite || !terrain || !dateEvent || !nbSeances || joursSelectionnes.length === 0 || !sortieLongue) {
            alert("Veuillez remplir tous les champs !");
            return;
        }

        if ((objectif === "marathon" && nbSeances < 3) || (objectif === "100km" && nbSeances < 4)) {
            alert("Cet objectif nécessite plus d'entraînements par semaine !");
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
                body: JSON.stringify({ 
                    objectif, objectifAutre, intensite, terrain, dateEvent, 
                    nbSeances, joursSelectionnes, sortieLongue, objectifsIntermediaires
                })
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
    });
});

// ✅ Ajout dynamique des objectifs intermédiaires
function ajouterObjectifIntermediaire() {
    const container = document.getElementById("objectifs-intermediaires");
    const div = document.createElement("div");
    div.classList.add("objectif-intermediaire");
    div.innerHTML = `
        <input type="text" class="type-objectif" placeholder="Nom de la course" required>
        <input type="date" class="date-objectif" required>
        <button type="button" onclick="this.parentElement.remove()">❌</button>
    `;
    container.appendChild(div);
}
