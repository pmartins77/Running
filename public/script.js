document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadCalendar();
});

// ✅ Vérifier la connexion utilisateur
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

// ✅ Déconnexion de l'utilisateur
function logout() {
    localStorage.removeItem("jwt");
    alert("Vous avez été déconnecté.");
    window.location.href = "login.html";
}

// ✅ Variables pour suivre l'année et le mois affichés
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

// ✅ Charger le calendrier avec les entraînements
async function loadCalendar(year = currentYear, month = currentMonth) {
    currentYear = year;
    currentMonth = month;

    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
        console.log(`📌 Chargement des entraînements pour year=${year}, month=${month}`);

        const response = await fetch(`/api/getTrainings?year=${year}&month=${month}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des entraînements.");
        }

        const trainings = await response.json();
        displayCalendar(trainings, year, month);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
    }
}

// ✅ Afficher les entraînements dans le calendrier
function displayCalendar(trainings, year, month) {
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = ""; // Nettoyage avant affichage

    // ✅ Création du calendrier en grille
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    // ✅ En-tête des jours de la semaine
    const daysHeader = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const headerRow = document.createElement("div");
    headerRow.classList.add("calendar-header");
    daysHeader.forEach(day => {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day-header");
        dayDiv.textContent = day;
        headerRow.appendChild(dayDiv);
    });
    calendarDiv.appendChild(headerRow);

    // ✅ Création des jours du mois
    let dayCount = 1;
    for (let i = 0; i < 6; i++) { // 6 semaines max
        const row = document.createElement("div");
        row.classList.add("calendar-row");

        for (let j = 0; j < 7; j++) {
            const dayDiv = document.createElement("div");
            dayDiv.classList.add("day");

            if (i === 0 && j < firstDay) {
                dayDiv.classList.add("empty"); // Cases vides avant le premier jour
            } else if (dayCount > daysInMonth) {
                dayDiv.classList.add("empty"); // Cases vides après le dernier jour
            } else {
                dayDiv.textContent = dayCount;

                const trainingForDay = trainings.find(training => 
                    new Date(training.date).getDate() === dayCount
                );

                if (trainingForDay) {
                    dayDiv.classList.add("has-training");
                    dayDiv.onclick = () => showTrainingDetails(trainingForDay);
                }

                dayCount++;
            }

            row.appendChild(dayDiv);
        }
        calendarDiv.appendChild(row);
    }

    // ✅ Mettre à jour le mois affiché
    document.getElementById("currentMonth").textContent =
        new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
}

// ✅ Afficher les détails de l'entraînement sélectionné
function showTrainingDetails(training) {
    const detailsDiv = document.getElementById("trainingDetails");
    detailsDiv.innerHTML = `
        <h3>📅 ${new Date(training.date).toLocaleDateString()}</h3>
        <p><strong>Type :</strong> ${training.type || "Inconnu"}</p>
        <p><strong>Durée :</strong> ${training.duration || "N/A"} min</p>
        <p><strong>Distance :</strong> ${training.distance || "0"} km</p>
        <p><strong>Détails :</strong> ${training.details || "Aucune description"}</p>
    `;
}

// ✅ Changer de mois
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

// ✅ Importation d'un fichier CSV
function uploadCSV() {
    const fileInput = document.getElementById("csvFileInput");
    if (!fileInput.files.length) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const file = fileInput.files[0];
    console.log("📌 Fichier sélectionné :", file.name);

    const formData = new FormData();
    formData.append("file", file);

    // ✅ Debugging: Vérifier le contenu du formData avant l'envoi
    for (let pair of formData.entries()) {
        console.log("✅ FormData envoyé :", pair[0], pair[1]);
    }

    fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Échec de l'importation du fichier CSV.");
        }
        return response.json();
    })
    .then(data => {
        console.log("✅ Réponse du serveur :", data);
        alert(data.message || "Importation réussie !");
        loadCalendar();
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'importation du fichier CSV :", error);
        alert("Erreur lors de l'importation du fichier CSV.");
    });
}

// ✅ Supprimer tous les entraînements
function deleteAllTrainings() {
    if (!confirm("Voulez-vous vraiment supprimer tous vos entraînements ?")) return;

    fetch("/api/deleteAll", {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || "Tous les entraînements ont été supprimés.");
        loadCalendar();
    })
    .catch(error => {
        console.error("❌ Erreur lors de la suppression des entraînements :", error);
        alert("Erreur lors de la suppression des entraînements.");
    });
}
