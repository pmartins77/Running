document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadCalendar();
});

// 1️⃣ **Vérifier la connexion**
function checkLogin() {
    const token = localStorage.getItem("jwt");

    if (!token) {
        alert("Vous devez être connecté !");
        window.location.href = "login.html";
        return;
    }

    fetch("/api/auth/user", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (response.status === 401 || response.status === 403) {
            alert("Votre session a expiré, veuillez vous reconnecter.");
            localStorage.removeItem("jwt");
            window.location.href = "login.html";
        }
    })
    .catch(error => {
        console.error("❌ Erreur de vérification du token :", error);
    });
}

// 2️⃣ **Déconnexion**
function logout() {
    localStorage.removeItem("jwt");
    alert("Vous avez été déconnecté.");
    window.location.href = "login.html";
}

let currentYear, currentMonth;

// 3️⃣ **Charger le calendrier avec les entraînements**
async function loadCalendar(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
    currentYear = year;
    currentMonth = month;

    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
        const response = await fetch(`/api/getTrainings?year=${year}&month=${month}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Erreur API : ${response.statusText}`);
        }

        const trainings = await response.json();

        if (!Array.isArray(trainings)) {
            throw new Error("Données invalides reçues du serveur");
        }

        generateCalendar(year, month, trainings);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
        alert("Erreur lors du chargement des entraînements.");
    }
}

// 4️⃣ **Génération du calendrier avec les jours et entraînements**
function generateCalendar(year, month, trainings) {
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = ""; // Réinitialisation du calendrier

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    // 🏷 Ajouter les jours de la semaine
    const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day-header");
        dayElement.textContent = day;
        calendarDiv.appendChild(dayElement);
    });

    // 🏷 Remplir le calendrier avec des cases vides si le mois ne commence pas un lundi
    for (let i = 0; i < (firstDayIndex === 0 ? 6 : firstDayIndex - 1); i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("day", "empty");
        calendarDiv.appendChild(emptyCell);
    }

    // 🏷 Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day");
        dayElement.textContent = day;

        // Vérifier si un entraînement est prévu ce jour-là
        const training = trainings.find(t => new Date(t.date).getDate() === day);
        if (training) {
            dayElement.classList.add("has-training");
            dayElement.setAttribute("title", training.details);
            dayElement.onclick = () => showTrainingDetails(training);
        }

        calendarDiv.appendChild(dayElement);
    }

    // Mettre à jour le mois affiché
    document.getElementById("currentMonth").textContent = `${year}-${month.toString().padStart(2, "0")}`;
}

// ✅ Nettoyer l'affichage des détails d'entraînement
function clearTrainingDetails() {
    document.getElementById("trainingDetails").innerHTML = "";
}

// 5️⃣ **Afficher les détails d'un entraînement**
function showTrainingDetails(training) {
    clearTrainingDetails(); // Nettoyer avant affichage
    document.getElementById("trainingDetails").innerHTML = `
        <div class="training-card">
            <h3>📅 ${new Date(training.date).toLocaleDateString()}</h3>
            <p><strong>Échauffement :</strong> ${training.echauffement}</p>
            <p><strong>Type :</strong> ${training.type}</p>
            <p><strong>Durée :</strong> ${training.duration} min</p>
            <p><strong>Intensité :</strong> ${training.intensity}</p>
            <p><strong>Détails :</strong> ${training.details}</p>
        </div>
    `;
}

// 6️⃣ **Navigation entre les mois**
function changeMonth(direction) {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;

    if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    } else if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    }

    clearTrainingDetails(); // ✅ Effacer l'affichage des détails lors du changement de mois
    loadCalendar(newYear, newMonth);
}

// 📂 7️⃣ **Suppression de tous les entraînements**
async function deleteAllTrainings() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté pour supprimer des entraînements.");
        return;
    }

    if (!confirm("Voulez-vous vraiment supprimer tous vos entraînements ? Cette action est irréversible.")) {
        return;
    }

    try {
        const response = await fetch("/api/deleteAll", {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Erreur API : ${response.statusText}`);
        }

        alert("✅ Tous les entraînements ont été supprimés !");
        clearTrainingDetails(); // ✅ Effacer l'affichage des détails
        loadCalendar(); // ✅ Recharger le calendrier
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des entraînements :", error);
        alert("Erreur lors de la suppression des entraînements.");
    }
}

// 📂 8️⃣ **Fonction d'importation du fichier CSV**
async function uploadCSV() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté pour importer un fichier CSV.");
        return;
    }

    const fileInput = document.getElementById("csvFileInput");
    if (!fileInput.files.length) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (event) {
        const csvData = event.target.result;
        const parsedData = parseCSV(csvData);

        if (!parsedData.length) {
            alert("Le fichier CSV est vide ou mal formaté.");
            return;
        }

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(parsedData)
            });

            if (response.ok) {
                alert("✅ Importation réussie !");
                loadCalendar();
            } else {
                alert("❌ Erreur lors de l'importation.");
            }
        } catch (error) {
            console.error("❌ Erreur d'importation :", error);
        }
    };

    reader.readAsText(file);
}

// 📂 **Fonction de parsing du CSV**
function parseCSV(csvText) {
    const rows = csvText.split("\n").map(row => row.trim()).filter(row => row);
    const headers = rows.shift().split(",");

    return rows.map(row => {
        const values = row.split(",");
        let entry = {};
        headers.forEach((header, index) => {
            entry[header.trim()] = values[index] ? values[index].trim() : "";
        });
        return entry;
    });
}
