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
        }

        calendarDiv.appendChild(dayElement);
    }
}

// 5️⃣ **Navigation entre les mois**
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
