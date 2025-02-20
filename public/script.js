document.addEventListener("DOMContentLoaded", function () {
    loadCalendar();
});

// Charger le calendrier avec les jours du mois
function loadCalendar() {
    const calendar = document.getElementById("calendar");
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    updateCalendar(currentMonth, currentYear);
}

// Mettre à jour le calendrier
function updateCalendar(month, year) {
    const calendar = document.getElementById("calendar");
    const currentMonthElement = document.getElementById("currentMonth");

    // Mettre à jour l'affichage du mois
    currentMonthElement.textContent = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    // Générer les jours du mois
    calendar.innerHTML = "";
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        let dayElement = document.createElement("button");
        dayElement.textContent = day;
        dayElement.onclick = function () { fetchTrainingDetails(day, month + 1, year); };
        calendar.appendChild(dayElement);
    }
}

// Récupérer les détails de l'entraînement depuis la base PostgreSQL
function fetchTrainingDetails(day, month, year) {
    const selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    document.getElementById("selectedDate").textContent = `📅 Date sélectionnée : ${selectedDate}`;

    fetch(`/api/getTrainings?date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            const trainingInfo = document.getElementById("trainingInfo");
            trainingInfo.innerHTML = ""; // Vider l'affichage précédent

            if (data && data.length > 0) {
                let training = data[0]; // Prendre la première séance (à améliorer si plusieurs)
                trainingInfo.innerHTML = `
                    <p><strong>Échauffement :</strong> ${training.echauffement}</p>
                    <p><strong>Type :</strong> ${training.type}</p>
                    <p><strong>Durée :</strong> ${training.duration} min</p>
                    <p><strong>Intensité :</strong> ${training.intensity}</p>
                    <p><strong>Détails :</strong> ${training.details}</p>
                `;
            } else {
                trainingInfo.innerHTML = "<p>Aucun entraînement prévu pour cette date.</p>";
            }
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des entraînements :", error);
            document.getElementById("trainingInfo").innerHTML = "<p>❌ Erreur de récupération des données.</p>";
        });
}
