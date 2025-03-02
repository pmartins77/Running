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

// ✅ Variables pour gérer l'affichage du calendrier
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

// ✅ Charger le calendrier des entraînements
async function loadCalendar(year = currentYear, month = currentMonth) {
    currentYear = year;
    currentMonth = month;

    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
        console.log(`📌 Chargement des entraînements pour ${year}-${month}`);

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

    // 📅 Création de la structure du calendrier
    const firstDay = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();

    // 📌 En-tête des jours de la semaine
    const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    daysOfWeek.forEach(day => {
        const header = document.createElement("div");
        header.classList.add("day-header");
        header.textContent = day;
        calendarDiv.appendChild(header);
    });

    let dayCount = 1;
    for (let i = 0; i < 6; i++) { // Maximum 6 semaines dans un mois
        for (let j = 0; j < 7; j++) {
            const dayDiv = document.createElement("div");

            if ((i === 0 && j < (firstDay === 0 ? 6 : firstDay - 1)) || dayCount > totalDays) {
                dayDiv.classList.add("day", "empty");
            } else {
                dayDiv.classList.add("day");
                dayDiv.textContent = dayCount;

                // Vérifier si un entraînement est prévu ce jour-là
                let trainingInfo = trainings.find(t => new Date(t.date).getDate() === dayCount);
                if (trainingInfo) {
                    dayDiv.classList.add("has-training");
                    dayDiv.onclick = () => showTrainingDetails(trainingInfo);
                    
                    // ✅ Correction de l'affichage détaillé des entraînements
                    dayDiv.innerHTML = `
                        <strong>${dayCount}</strong><br>
                        🏃 ${trainingInfo.name || "Entraînement"}<br>
                        📏 ${trainingInfo.distance || 0} km<br>
                        ⏱️ ${trainingInfo.duration || "?"} min<br>
                        🔥 ${trainingInfo.intensity || "?"}<br>
                    `;
                }

                dayCount++;
            }

            calendarDiv.appendChild(dayDiv);
        }
        if (dayCount > totalDays) break;
    }

    // ✅ Mettre à jour le mois affiché
    document.getElementById("currentMonth").textContent =
        new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
}

// ✅ Afficher les détails d'un entraînement
function showTrainingDetails(training) {
    const detailsDiv = document.getElementById("trainingDetails");
    detailsDiv.innerHTML = `
        <h3>📋 Détails de l'entraînement</h3>
        <p><strong>Date :</strong> ${new Date(training.date).toLocaleDateString()}</p>
        <p><strong>Nom :</strong> ${training.name || "Entraînement"}</p>
        <p><strong>Distance :</strong> ${training.distance || 0} km</p>
        <p><strong>Durée :</strong> ${training.duration || "?"} min</p>
        <p><strong>Intensité :</strong> ${training.intensity || "?"}</p>
        <p><strong>Type :</strong> ${training.type || "?"}</p>
    `;
}

// ✅ Correction de l'importation du fichier CSV
function uploadCSV() {
    const fileInput = document.getElementById("csvFileInput");
    if (!fileInput.files.length) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

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
