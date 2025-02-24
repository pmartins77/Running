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

// ✅ Mettre à jour le calendrier avec les jours du mois et marquer ceux avec entraînement
function updateCalendar(month, year) {
    const calendar = document.getElementById("calendar");
    const currentMonthElement = document.getElementById("currentMonth");

    currentMonthElement.textContent = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    calendar.innerHTML = "";
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Aucun token trouvé. Utilisateur non authentifié.");
        return;
    }

    fetch(`/api/getTrainings?year=${year}&month=${month + 1}`, {
        method: "GET",
        headers: { "Authorization": "Bearer " + token }
    })
    .then(response => response.json())
    .then(trainings => {
        console.log("📌 Données reçues de getTrainings :", trainings);
        let trainingDays = trainings.map(t => new Date(t.date).getDate());

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

// ✅ Fonction pour changer de mois
function changeMonth(direction) {
    const currentMonthElement = document.getElementById("currentMonth").textContent;
    let [monthName, year] = currentMonthElement.split(" ");
    let yearNumber = parseInt(year);

    const monthNames = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];

    let monthIndex = monthNames.indexOf(monthName.toLowerCase());

    if (monthIndex === -1) {
        console.error("❌ Erreur : Mois invalide détecté !");
        return;
    }

    monthIndex += direction;
    if (monthIndex < 0) { 
        monthIndex = 11; 
        yearNumber--; 
    }
    if (monthIndex > 11) { 
        monthIndex = 0; 
        yearNumber++; 
    }

    document.getElementById("selectedDate").textContent = "";
    document.getElementById("trainingInfo").innerHTML = "Aucun entraînement prévu.";
    
    updateCalendar(monthIndex, yearNumber);
}

// ✅ Fonction pour récupérer les détails d'un entraînement
function fetchTrainingDetails(day, month, year) {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Aucun token trouvé. Utilisateur non authentifié.");
        return;
    }

    const selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    document.getElementById("selectedDate").textContent = selectedDate;

    fetch(`/api/getTrainings?date=${selectedDate}`, {
        method: "GET",
        headers: { "Authorization": "Bearer " + token }
    })
    .then(response => response.json())
    .then(data => {
        const trainingDetails = document.getElementById("trainingInfo");

        if (data && data.length > 0) {
            const training = data[0];
            trainingDetails.innerHTML = `
                <div class="training-card">
                    <h3>📅 Programme du ${selectedDate}</h3>
                    <p><strong>🔥 Échauffement :</strong> ${training.echauffement || "Non précisé"}</p>
                    <p><strong>🏃 Type :</strong> ${training.type || "Non précisé"}</p>
                    <p><strong>⏳ Durée :</strong> ${training.duration || "Non précisé"} min</p>
                    <p><strong>💪 Intensité :</strong> ${training.intensity || "Non précisé"}</p>
                    <p><strong>📋 Détails :</strong> ${training.details || "Non précisé"}</p>
                </div>
            `;
        } else {
            trainingDetails.innerHTML = `<p class="no-training">Aucun entraînement prévu.</p>`;
        }
    })
    .catch(error => console.error("❌ Erreur lors de la récupération :", error));
}

// ✅ Fonction pour convertir un CSV en JSON
function csvToJson(csv) {
    const lines = csv.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    const headers = lines[0].split(",").map(h => h.trim());

    const data = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

        if (!values || values.length !== headers.length) {
            console.warn("❌ Ligne ignorée (mauvais format) :", line);
            return null;
        }

        return Object.fromEntries(headers.map((h, i) => [h, values[i].replace(/"/g, "").trim()]));
    }).filter(row => row !== null);

    return data;
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
        .then(response => response.json())
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
        const token = localStorage.getItem("token");

        fetch("/api/deleteAll", {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        })
        .then(response => response.json())
        .then(data => {
            console.log("✅ Réponse suppression :", data);
            alert("✅ Toutes les données ont été supprimées !");
            location.reload();
        })
        .catch(error => console.error("❌ Erreur lors de la suppression :", error));
    }
}


// ✅ Exposer les fonctions globalement pour qu'elles soient accessibles dans la console
window.updateCalendar = updateCalendar;
window.changeMonth = changeMonth;
window.fetchTrainingDetails = fetchTrainingDetails;
window.uploadCSV = uploadCSV;
window.deleteAllData = deleteAllData;
