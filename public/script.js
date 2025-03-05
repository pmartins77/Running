document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/getTrainings", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    })
    .then((response) => response.json())
    .then((data) => {
        const trainingList = document.getElementById("training-list");
        trainingList.innerHTML = "";

        data.forEach((training) => {
            const trainingItem = document.createElement("div");
            trainingItem.classList.add("training-item");

            trainingItem.innerHTML = `
                <h3>${new Date(training.date).toLocaleDateString()} - ${training.type}</h3>
                <p><strong>Durée :</strong> ${training.duration} min</p>
                <p><strong>Échauffement :</strong> ${training.echauffement || "Non précisé"}</p>
                <p><strong>Intensité :</strong> ${training.intensity}</p>
                <p><strong>Objectif :</strong> ${training.objectif_type || "Aucun"}</p>
                <p><strong>Détails :</strong> ${training.details || "Aucun détail"}</p>
                <p><strong>Fréquence cardiaque cible :</strong> ${training.fc_cible || "Non précisée"}</p>
                <p><strong>Zone de fréquence cardiaque :</strong> ${training.zone_fc || "Non spécifiée"}</p>
                <p><strong>Récupération :</strong> ${training.recovery || "Non précisé"}</p>
                <p><strong>Charge d'entraînement estimée :</strong> ${training.planifie_par_ai ? "Généré par IA" : "Manuel"}</p>
                <p><strong>Dénivelé :</strong> ${training.total_elevation_gain ? training.total_elevation_gain + " m" : "Non disponible"}</p>
                <p><strong>Calories brûlées :</strong> ${training.calories || "Non disponible"}</p>
                <p><strong>Vitesse moyenne :</strong> ${training.average_speed ? training.average_speed.toFixed(2) + " km/h" : "Non disponible"}</p>

                <h4>🎯 Objectif lié</h4>
                <p><strong>Type :</strong> ${training.objectif_type || "Non spécifié"}</p>
                <p><strong>Dénivelé total :</strong> ${training.denivele_total ? training.denivele_total + " m" : "Non spécifié"}</p>
                <p><strong>Allures de référence :</strong> ${training.allures_reference || "Non spécifié"}</p>
                <p><strong>VMA estimée :</strong> ${training.vma_estimee || "Non spécifiée"}</p>
                <p><strong>FC Max estimée :</strong> ${training.fc_max_estimee || "Non spécifiée"}</p>
                <p><strong>Contraintes :</strong> ${training.contraintes || "Aucune"}</p>
                <p><strong>Nutrition recommandée :</strong> ${training.nutrition || "Non spécifiée"}</p>
                <p><strong>Terrain recommandé :</strong> ${training.terrain || "Non spécifié"}</p>
                <p><strong>Intensité :</strong> ${training.intensite || "Non spécifiée"}</p>
                <p><strong>Blessures à surveiller :</strong> ${training.blessures || "Aucune"}</p>
            `;

            trainingList.appendChild(trainingItem);
        });
    })
    .catch((error) => console.error("Erreur lors de la récupération des entraînements :", error));
});
