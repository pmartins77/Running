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
    calendarDiv.innerHTML = "";

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day-header");
        dayElement.textContent = day;
        calendarDiv.appendChild(dayElement);
    });

    for (let i = 0; i < (firstDayIndex === 0 ? 6 : firstDayIndex - 1); i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("day", "empty");
        calendarDiv.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day");
        dayElement.textContent = day;

        const training = trainings.find(t => new Date(t.date).getDate() === day);
        if (training) {
            dayElement.classList.add("has-training");
            dayElement.onclick = () => showTrainingDetails(training);
        }

        calendarDiv.appendChild(dayElement);
    }
}

// 5️⃣ **Afficher les détails d'un entraînement**
function showTrainingDetails(training) {
    const detailsDiv = document.getElementById("trainingDetails");
    detailsDiv.innerHTML = `
        <h3>📅 ${new Date(training.date).toLocaleDateString()}</h3>
        <p><strong>Échauffement :</strong> ${training.echauffement}</p>
        <p><strong>Type :</strong> ${training.type}</p>
        <p><strong>Durée :</strong> ${training.duration} min</p>
        <p><strong>Intensité :</strong> ${training.intensity}</p>
        <p><strong>Détails :</strong> ${training.details}</p>
    `;
}
