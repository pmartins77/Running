document.addEventListener("DOMContentLoaded", function () {
    loadCalendar();
});

function loadCalendar() {
    const currentDate = new Date();
    updateCalendar(currentDate.getMonth(), currentDate.getFullYear());
}

function updateCalendar(month, year) {
    const calendar = document.getElementById("calendar");
    const currentMonthElement = document.getElementById("currentMonth");

    currentMonthElement.textContent = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    calendar.innerHTML = "";
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

    fetch(`/api/getTrainings?date=${formattedDate}`)
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
        .catch(error => console.error("❌ Erreur lors de la récupération des entraînements :", error));
}

function changeMonth(direction) {
    const currentMonthElement = document.getElementById("currentMonth").textContent;
    let [monthName, year] = currentMonthElement.split(" ");
    let yearNumber = parseInt(year);

    const monthNames = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];

    let monthIndex = monthNames.indexOf(monthName.toLowerCase());
    if (monthIndex === -1) return;

    monthIndex += direction;
    if (monthIndex < 0) { monthIndex = 11; yearNumber--; }
    if (monthIndex > 11) { monthIndex = 0; yearNumber++; }

    document.getElementById("selectedDate").textContent = "";
    document.getElementById("trainingInfo").innerHTML = "Aucun entraînement prévu.";

    updateCalendar(monthIndex, yearNumber);
}

function fetchTrainingDetails(day, month, year) {
    const selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    document.getElementById("selectedDate").textContent = selectedDate;

    fetch(`/api/getTrainings?date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            const trainingDetails = document.getElementById("trainingInfo");
            if (data && data.length > 0) {
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
        .catch(error => console.error("❌ Erreur lors de la récupération :", error));
}

window.updateCalendar = updateCalendar;
window.changeMonth = changeMonth;
window.fetchTrainingDetails = fetchTrainingDetails;
