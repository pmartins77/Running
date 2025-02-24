document.addEventListener("DOMContentLoaded", function () {
    loadCalendar();
});

// ✅ Charger le calendrier
function loadCalendar() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("🚨 Aucun token trouvé, l'utilisateur n'est pas authentifié !");
        return;
    }

    fetch("/api/getTrainings?year=2025&month=2", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token, // ✅ Ajout du token dans le header
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("📌 Données reçues de getTrainings :", data);
        if (data.error) {
            console.error("❌ Erreur API getTrainings :", data.error);
            return;
        }
        updateCalendar(data);
    })
    .catch(error => console.error("❌ Erreur lors de la récupération des entraînements :", error));
}

// ✅ Fonction pour mettre à jour le calendrier avec les entraînements
function updateCalendar(trainings) {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = ""; // ✅ Réinitialiser

    let trainingDays = trainings.map(t => parseInt(t.date.split("-")[2])); // Extraire les jours avec entraînement

    for (let day = 1; day <= 31; day++) {
        let dayElement = document.createElement("div");
        dayElement.classList.add("day");
        dayElement.textContent = day;
        dayElement.onclick = function () { fetchTrainingDetails(day, 2, 2025); };

        if (trainingDays.includes(day)) {
            dayElement.classList.add("has-training");
        }

        calendar.appendChild(dayElement);
    }
}

// ✅ Fonction pour récupérer les détails d'un entraînement
function fetchTrainingDetails(day, month, year) {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Aucun token trouvé. Utilisateur non authentifié.");
        return;
    }

    const selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    fetch(`/api/getTrainings?date=${selectedDate}`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("📌 Données entraînement reçues :", data);
        const trainingDetails = document.getElementById("trainingInfo");

        if (data.length > 0) {
            const training = data[0];
            trainingDetails.innerHTML = `
                <div class="training-card">
                    <h3>📅 Programme du ${selectedDate}</h3>
                    <p><strong>🔥 Échauffement :</strong> ${training.echauffement}</p>
                    <p><strong>🏃 Type :</strong> ${training.type}</p>
                    <p><strong>⏳ Durée :</strong> ${training.duration} min</p>
                    <p><strong>💪 Intensité :</strong> ${training.intensity}</p>
                    <p><strong>📋 Détails :</strong> ${training.details}</p>
                </div>
            `;
        } else {
            trainingDetails.innerHTML = `<p class="no-training">Aucun entraînement prévu.</p>`;
        }
    })
    .catch(error => console.error("❌ Erreur récupération entraînement :", error));
}
