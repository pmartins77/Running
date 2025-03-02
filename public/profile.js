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

// ✅ Variables pour l'affichage du calendrier
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
        generateCalendar(year, month, trainings);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
    }
}

// ✅ Génération du calendrier
function generateCalendar(year, month, trainings) {
    const calendarDiv = document.getElementById("calendar");
    if (!calendarDiv) {
        console.error("❌ Erreur : l'élément 'calendar' est introuvable.");
        return;
    }

    calendarDiv.innerHTML = "";

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    // ✅ Ajouter les jours de la semaine
    const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day-header");
        dayElement.textContent = day;
        calendarDiv.appendChild(dayElement);
    });

    // ✅ Ajouter des cases vides si le mois ne commence pas un lundi
    for (let i = 0; i < (firstDayIndex === 0 ? 6 : firstDayIndex - 1); i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("day", "empty");
        calendarDiv.appendChild(emptyCell);
    }

    // ✅ Ajouter les jours du mois
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

    // ✅ Mettre à jour le mois affiché
    document.getElementById("currentMonth").textContent =
        new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
}

// ✅ Afficher les détails d'un entraînement
function showTrainingDetails(training) {
    document.getElementById("trainingDetails").innerHTML = `
        <h3>📋 Détails de l'entraînement</h3>
        <p><strong>Date :</strong> ${new Date(training.date).toLocaleDateString()}</p>
        <p><strong>Nom :</strong> ${training.name || "Entraînement"}</p>
        <p><strong>Distance :</strong> ${training.distance || 0} km</p>
        <p><strong>Durée :</strong> ${training.duration || "?"} min</p>
        <p><strong>Intensité :</strong> ${training.intensity || "?"}</p>
        <p><strong>Type :</strong> ${training.type || "?"}</p>
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
