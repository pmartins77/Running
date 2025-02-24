document.addEventListener("DOMContentLoaded", function () {
    loadCalendar();
});

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

// ✅ Vérifier si le token est valide avant de charger les entraînements
function fetchTrainings(year, month) {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Aucun token trouvé.");
        return Promise.reject("Aucun token disponible.");
    }

    return fetch(`/api/getTrainings?year=${year}&month=${month}`, {
        headers: { "Authorization": "Bearer " + token }
    }).then(response => response.json());
}

// ✅ Charger les entraînements avec vérification
function updateCalendar(month, year) {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    fetchTrainings(year, month + 1)
        .then(trainings => {
            trainings = Array.isArray(trainings) ? trainings : [];
            for (let day = 1; day <= daysInMonth; day++) {
                let dayElement = document.createElement("div");
                dayElement.classList.add("day");
                dayElement.textContent = day;
                dayElement.onclick = function () { fetchTrainingDetails(day, month + 1, year); };

                if (trainings.some(t => parseInt(t.date.split("-")[2]) === day)) {
                    dayElement.classList.add("has-training");
                }

                calendar.appendChild(dayElement);
            }
        })
        .catch(error => {
            console.error("❌ Erreur récupération des entraînements :", error);
        });
}

// ✅ Vérifier le token avant de récupérer les détails d’un entraînement
function fetchTrainingDetails(day, month, year) {
    if (!isValidDate(year, month, day)) {
        console.error(`❌ Date invalide demandée : ${year}-${month}-${day}`);
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Aucun token disponible.");
        return;
    }

    fetch(`/api/getTrainings?date=${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, {
        headers: { "Authorization": "Bearer " + token }
    })
    .then(response => response.json())
    .then(data => {
        const trainingDetails = document.getElementById("trainingInfo");
        if (data.length > 0) {
            const training = data[0];
            trainingDetails.innerHTML = `
                <div class="training-card">
                    <h3>📅 Programme du ${year}-${month}-${day}</h3>
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
