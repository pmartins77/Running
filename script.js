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

// Changer de mois
function changeMonth(direction) {
    const currentMonthElement = document.getElementById("currentMonth").textContent;
    let [month, year] = currentMonthElement.split(" ");
    let monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth();
    let yearNumber = parseInt(year);

    if (direction === -1) {
        monthIndex--;
        if (monthIndex < 0) {
            monthIndex = 11;
            yearNumber--;
        }
    } else {
        monthIndex++;
        if (monthIndex > 11) {
            monthIndex = 0;
            yearNumber++;
        }
    }

    updateCalendar(monthIndex, yearNumber);
}

// Récupérer les détails de l'entraînement depuis la base PostgreSQL
function fetchTrainingDetails(day, month, year) {
    const selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    document.getElementById("selectedDate").textContent = selectedDate;

    fetch(`/api/getTrainings?date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                document.getElementById("trainingInfo").textContent = data[0].session;
            } else {
                document.getElementById("trainingInfo").textContent = "Aucun entraînement prévu.";
            }
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des entraînements :", error);
        });
}

// Charger un fichier CSV et envoyer les données au serveur
function uploadCSV() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/upload", { method: "POST", body: formData })
        .then(response => response.text())
        .then(data => {
            alert("Fichier importé avec succès !");
        })
        .catch(error => {
            console.error("Erreur lors de l'importation :", error);
        });
}

// Supprimer toutes les données de la base PostgreSQL
function deleteAllData() {
    if (confirm("Voulez-vous vraiment supprimer toutes les données ?")) {
        fetch("/api/deleteAll", { method: "DELETE" })
            .then(response => response.text())
            .then(data => {
                alert("Toutes les données ont été supprimées !");
                location.reload();
            })
            .catch(error => {
                console.error("Erreur lors de la suppression :", error);
            });
    }
}
