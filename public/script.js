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
        if (!response.ok) {
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

// 3️⃣ **Charger le calendrier**
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

    const currentMonthElement = document.getElementById("currentMonth");
    if (currentMonthElement) {
        currentMonthElement.textContent = `${year}-${month.toString().padStart(2, "0")}`;
    } else {
        console.error("❌ Élément 'currentMonth' non trouvé dans le DOM !");
    }

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
        const training = trainings.find(t => new Date(t.date).getUTCDate() === day);
        if (training) {
            dayElement.classList.add("has-training");
            dayElement.setAttribute("title", training.details);

            // ✅ Ajouter un écouteur d'événement pour afficher les détails au clic
            dayElement.addEventListener("click", () => showTrainingDetails(training));
        }

        calendarDiv.appendChild(dayElement);
    }
}

// 5️⃣ **Affichage des détails d'un entraînement**
function showTrainingDetails(training) {
    const detailsDiv = document.getElementById("trainingDetails");
    if (!detailsDiv) {
        console.error("❌ Élément 'trainingDetails' non trouvé dans le DOM !");
        return;
    }

    detailsDiv.innerHTML = `
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

    loadCalendar(newYear, newMonth);
}

// 7️⃣ **Supprimer tous les entraînements**
async function deleteAllTrainings() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        return;
    }

    const confirmation = confirm("⚠️ Êtes-vous sûr de vouloir supprimer tous vos entraînements ?");
    if (!confirmation) return;

    try {
        const response = await fetch("/api/deleteAll", {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ Plan d'entraînement supprimé !");
            loadCalendar(); // Recharger le calendrier après suppression
        } else {
            alert("❌ Erreur : " + data.error);
        }
    } catch (error) {
        console.error("❌ Erreur lors de la suppression :", error);
        alert("❌ Impossible de supprimer les entraînements.");
    }
}

// 📂 1️⃣ Fonction d'importation du fichier CSV
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

            const result = await response.json();
            if (response.ok) {
                alert("✅ Importation réussie !");
                loadCalendar(); // Rafraîchir le calendrier après l'import
            } else {
                alert("❌ Erreur lors de l'importation : " + result.error);
            }
        } catch (error) {
            console.error("❌ Erreur d'importation :", error);
            alert("Une erreur est survenue lors de l'importation.");
        }
    };

    reader.readAsText(file);
}

// 📂 2️⃣ Fonction pour parser le fichier CSV en JSON
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
