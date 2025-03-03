document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadCalendar();

    // ✅ Ajout de l'événement sur le bouton "Générer mon Plan"
    document.getElementById("generate-plan").addEventListener("click", generatePlan);
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
        } else {
            document.getElementById("logoutButton").style.display = "inline-block";
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
            if (response.status === 401) {
                alert("Votre session a expiré, veuillez vous reconnecter.");
                localStorage.removeItem("jwt");
                window.location.href = "login.html";
            }
            throw new Error("Erreur lors de la récupération des entraînements.");
        }

        const trainings = await response.json();
        displayCalendar(trainings, year, month);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
    }
}

// ✅ Générer le calendrier avec les dates
function displayCalendar(trainings, year, month) {
    const calendarDiv = document.getElementById("calendar");
    if (!calendarDiv) {
        console.error("❌ Erreur : l'élément #calendar est introuvable.");
        return;
    }

    calendarDiv.innerHTML = "";

    const firstDay = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();

    const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    daysOfWeek.forEach(day => {
        const header = document.createElement("div");
        header.classList.add("day-header");
        header.textContent = day;
        calendarDiv.appendChild(header);
    });

    let dayCount = 1;
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            const dayDiv = document.createElement("div");

            if ((i === 0 && j < (firstDay === 0 ? 6 : firstDay - 1)) || dayCount > totalDays) {
                dayDiv.classList.add("day", "empty");
            } else {
                dayDiv.classList.add("day");
                dayDiv.textContent = dayCount;

                let trainingInfo = trainings.find(t => new Date(t.date).getDate() === dayCount);
                if (trainingInfo) {
                    dayDiv.classList.add("has-training");
                    dayDiv.onclick = () => showTrainingDetails(trainingInfo);
                }

                dayCount++;
            }
            calendarDiv.appendChild(dayDiv);
        }
        if (dayCount > totalDays) break;
    }

    document.getElementById("currentMonth").textContent =
        new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
}

// ✅ Fonction pour générer le plan d'entraînement
async function generatePlan() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        return;
    }

    try {
        const response = await fetch("/api/plan/generate", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            alert("✅ Plan d'entraînement généré avec succès !");
            loadCalendar();
        } else {
            alert("❌ Erreur lors de la génération du plan : " + data.message);
        }
    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan :", error);
        alert("Erreur lors de la génération du plan.");
    }
}

// ✅ Correction du changement de mois
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
