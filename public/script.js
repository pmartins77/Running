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

// ✅ Mettre à jour le calendrier avec les jours du mois
function updateCalendar(month, year) {
    const calendar = document.getElementById("calendar");
    const currentMonthElement = document.getElementById("currentMonth");

    currentMonthElement.textContent = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    calendar.innerHTML = "";
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        let dayElement = document.createElement("button");
        dayElement.textContent = day;
        dayElement.onclick = function () { fetchTrainingDetails(day, month + 1, year); };
        calendar.appendChild(dayElement);
    }
}

// ✅ Fonction pour changer de mois
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

// ✅ Fonction pour récupérer les entraînements
function fetchTrainingDetails(day, month, year) {
    const selectedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    document.getElementById("selectedDate").textContent = selectedDate;

    fetch(`/api/getTrainings?date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                document.getElementById("trainingInfo").textContent = `${data[0].echauffement}, ${data[0].type}, ${data[0].duration} min, ${data[0].intensity}, ${data[0].details}`;
            } else {
                document.getElementById("trainingInfo").textContent = "Aucun entraînement prévu.";
            }
        })
        .catch(error => {
            console.error("❌ Erreur lors de la récupération des entraînements :", error);
        });
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

// ✅ Fonction pour convertir CSV en JSON
function csvToJson(csv) {
    const lines = csv.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    const headers = lines[0].split(",").map(h => h.trim()); // Nettoyage des en-têtes

    const data = lines.slice(1).map(line => {
        // Séparer en tenant compte des valeurs entre guillemets
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

// ✅ Fonction pour supprimer toutes les données
function deleteAllData() {
    if (confirm("❌ Voulez-vous vraiment supprimer toutes les données ?")) {
        fetch("/api/deleteAll", { method: "DELETE" })
            .then(response => response.json())
            .then(data => {
                alert("✅ Toutes les données ont été supprimées !");
                location.reload();
            })
            .catch(error => {
                console.error("❌ Erreur lors de la suppression :", error);
            });
    }
}
