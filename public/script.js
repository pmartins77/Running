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

    // Récupérer les jours qui ont un entraînement
    fetch(`/api/getTrainings?year=${year}&month=${month + 1}`)
        .then(response => response.json())
        .then(trainings => {
            let trainingDays = trainings.map(t => parseInt(t.date.split("-")[2])); // Extraire les jours avec entraînement

            for (let day = 1; day <= daysInMonth; day++) {
                let dayElement = document.createElement("div");
                dayElement.classList.add("day");
                dayElement.textContent = day;
                dayElement.onclick = function () { fetchTrainingDetails(day, month + 1, year); };

                // ✅ Si le jour a un entraînement, on ajoute une classe spéciale
                if (trainingDays.includes(day)) {
                    dayElement.classList.add("has-training");
                }

                calendar.appendChild(dayElement);
            }
        })
        .catch(error => {
            console.error("❌ Erreur lors de la récupération des entraînements :", error);
            // ✅ Si la requête échoue, on génère quand même le calendrier sans marquer les entraînements
            for (let day = 1; day <= daysInMonth; day++) {
                let dayElement = document.createElement("div");
                dayElement.classList.add("day");
                dayElement.textContent = day;
                dayElement.onclick = function () { fetchTrainingDetails(day, month + 1, year); };

                calendar.appendChild(dayElement);
            }
        });
}

// ✅ Fonction pour changer de mois (corrigée avec reset de l'affichage des entraînements)
function changeMonth(direction) {
    const currentMonthElement = document.getElementById("currentMonth").textContent;

    // Extraire le mois et l'année à partir du texte affiché
    let [monthName, year] = currentMonthElement.split(" ");
    let yearNumber = parseInt(year);

    // Liste des mois en français pour trouver leur index
    const monthNames = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];

    let monthIndex = monthNames.indexOf(monthName.toLowerCase());

    if (monthIndex === -1) {
        console.error("❌ Erreur : Mois invalide détecté !");
        return;
    }

    // Modifier le mois
    monthIndex += direction;
    if (monthIndex < 0) { 
        monthIndex = 11; 
        yearNumber--; 
    }
    if (monthIndex > 11) { 
        monthIndex = 0; 
        yearNumber++; 
    }

    // ✅ Réinitialiser l'affichage de l'entraînement
    document.getElementById("selectedDate").textContent = "";
    document.getElementById("trainingInfo").innerHTML = "Aucun entraînement prévu.";

    // Mettre à jour le calendrier avec les valeurs corrigées
    updateCalendar(monthIndex, yearNumber);
}

// ✅ Fonction pour récupérer les entraînements
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

// ✅ Fonction pour convertir un CSV en JSON
function csvToJson(csv) {
    const lines = csv.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    const headers = lines[0].split(",").map(h => h.trim()); // Extraction des en-têtes

    const data = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

        if (!values || values.length !== 6) {
            console.warn("❌ Ligne ignorée (mauvais format) :", line);
            return null;
        }

        return {
            date: values[0].replace(/"/g, "").trim(),
            echauffement: values[1].replace(/"/g, "").trim(),
            type: values[2].replace(/"/g, "").trim(),
            duration: values[3].replace(/"/g, "").trim(),
            intensity: values[4].replace(/"/g, "").trim(),
            details: values[5].replace(/"/g, "").trim()
        };
    }).filter(row => row !== null); // Supprimer les lignes invalides

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

        console.log("📌 Données JSON envoyées au serveur :", jsonData); // DEBUG

        fetch("/api/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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
        fetch("/api/deleteAll", { method: "DELETE" })
            .then(response => response.json())
            .then(() => {
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
