document.addEventListener("DOMContentLoaded", function () {
    loadCalendar();
});

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ✅ Charger le calendrier
function loadCalendar() {
    updateCalendar(currentMonth, currentYear);
}

// ✅ Mettre à jour le calendrier
function updateCalendar(month, year) {
    const calendar = document.getElementById("calendar");
    const currentMonthElement = document.getElementById("currentMonth");

    if (!calendar || !currentMonthElement) {
        console.error("❌ Erreur : Élément du calendrier introuvable !");
        return;
    }

    // ✅ Affichage du mois en cours
    currentMonthElement.textContent = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    calendar.innerHTML = ""; // ✅ Efface l'ancien contenu
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        let dayElement = document.createElement("div");
        dayElement.classList.add("day");
        dayElement.textContent = day;

        dayElement.onclick = function () {
            fetchTrainingDetails(day, month + 1, year);
        };

        calendar.appendChild(dayElement);
    }
}

// ✅ Fonction pour changer de mois
function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateCalendar(currentMonth, currentYear);
}

// ✅ Fonction pour récupérer les entraînements
function fetchTrainingDetails(day, month, year) {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Aucun token trouvé. Utilisateur non authentifié.");
        return;
    }

    const selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    console.log("📌 Requête API pour les entraînements du", selectedDate);

    fetch(`/api/getTrainings?date=${selectedDate}`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("📌 Données entraînement reçues :", data);
        document.getElementById("selectedDate").textContent = selectedDate;
        document.getElementById("trainingInfo").textContent = data.length > 0 ? data[0].details : "Aucun entraînement prévu.";
    })
    .catch(error => console.error("❌ Erreur lors de la récupération :", error));
}

// ✅ Fonction pour importer un fichier CSV
function uploadCSV() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const csvData = event.target.result;
        const jsonData = csvToJson(csvData);

        console.log("📌 Données JSON envoyées au serveur :", jsonData);

        fetch("/api/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(jsonData),
        })
        .then(response => response.text())
        .then(() => {
            alert("✅ Fichier importé avec succès !");
            location.reload();
        })
        .catch(error => console.error("❌ Erreur lors de l'importation :", error));
    };

    reader.readAsText(file);
}

// ✅ Fonction pour supprimer toutes les données
function deleteAllData() {
    if (confirm("❌ Voulez-vous vraiment supprimer toutes les données ?")) {
        fetch("/api/deleteAll", {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
        })
        .then(response => response.json())
        .then(() => {
            alert("✅ Toutes les données ont été supprimées !");
            location.reload();
        })
        .catch(error => console.error("❌ Erreur lors de la suppression :", error));
    }
}

// ✅ Exposer les fonctions globalement
window.updateCalendar = updateCalendar;
window.changeMonth = changeMonth;
window.fetchTrainingDetails = fetchTrainingDetails;
window.uploadCSV = uploadCSV;
window.deleteAllData = deleteAllData;
