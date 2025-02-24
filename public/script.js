document.addEventListener("DOMContentLoaded", function () {
    loadCalendar();
});

// ✅ Charger le calendrier
function loadCalendar() {
    const calendar = document.getElementById("calendar");
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    updateCalendar(currentMonth, currentYear);
}

// ✅ Vérifier la validité des dates pour éviter les erreurs
function isValidDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}

// ✅ Mettre à jour le calendrier avec les jours du mois et marquer ceux avec entraînement
function updateCalendar(month, year) {
    const calendar = document.getElementById("calendar");
    const currentMonthElement = document.getElementById("currentMonth");

    currentMonthElement.textContent = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    calendar.innerHTML = "";
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    fetch(`/api/getTrainings?year=${year}&month=${month + 1}`, {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    })
    .then(response => response.json())
    .then(trainings => {
        let trainingDays = trainings.map(t => parseInt(t.date.split("-")[2]));

        for (let day = 1; day <= daysInMonth; day++) {
            let dayElement = document.createElement("div");
            dayElement.classList.add("day");
            dayElement.textContent = day;
            dayElement.onclick = function () { fetchTrainingDetails(day, month + 1, year); };

            if (trainingDays.includes(day)) {
                dayElement.classList.add("has-training");
            }

            calendar.appendChild(dayElement);
        }
    })
    .catch(error => console.error("❌ Erreur récupération entraînements :", error));
}

// ✅ Récupérer les entraînements avec vérification des dates valides
function fetchTrainingDetails(day, month, year) {
    if (!isValidDate(year, month, day)) {
        console.error(`❌ Date invalide demandée : ${year}-${month}-${day}`);
        return;
    }

    const selectedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    document.getElementById("selectedDate").textContent = selectedDate;

    fetch(`/api/getTrainings?date=${selectedDate}`, {
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    })
    .then(response => response.json())
    .then(data => {
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
