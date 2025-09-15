let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

document.addEventListener("DOMContentLoaded", async () => {
    checkLogin();
    loadCalendar(currentYear, currentMonth);
    loadAthleteProfile();

    document.getElementById("generate-plan").addEventListener("click", () => {
        window.location.href = "plan.html";
    });
});

// Vérification de la connexion utilisateur
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
    .then(response => response.json())
    .then(user => {
        if (!user.id) {
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

// Charger le calendrier des entraînements
async function loadCalendar(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
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

// Afficher le calendrier et associer les entraînements aux dates
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

// Afficher les détails d'un entraînement
function showTrainingDetails(training) {
    const detailsDiv = document.getElementById("trainingDetails");
    detailsDiv.innerHTML = `
        <h3>📋 Détails de l'entraînement</h3>
        <p><strong>Date :</strong> ${new Date(training.date).toLocaleDateString()}</p>
        <p><strong>Échauffement :</strong> ${training.echauffement || "?"}</p>
        <p><strong>Type :</strong> ${training.type || "?"}</p>
        <p><strong>Durée :</strong> ${training.duree || "?"} min</p>
        <p><strong>Intensité :</strong> ${training.intensite || "?"}</p>
        <p><strong>Fréquence cardiaque cible :</strong> ${training.fc_cible || "?"}</p>
        <p><strong>Détails :</strong> ${training.details || "?"}</p>
        <p><strong>Récupération :</strong> ${training.recuperation || "?"}</p>
        <p><strong>Charge d'entraînement :</strong> ${training.charge || "?"}</p>
        <p><strong>Conseils :</strong> ${training.conseils || "?"}</p>
    `;
}

// Charger et afficher le profil de l'athlète
async function loadAthleteProfile() {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
        const response = await fetch("/api/athlete/profile", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Votre session a expiré, veuillez vous reconnecter.");
                localStorage.removeItem("jwt");
                window.location.href = "login.html";
            }
            throw new Error("Erreur lors de la récupération du profil athlète.");
        }

        const data = await response.json();

        const vmaEl = document.getElementById("vma");
        if (vmaEl) vmaEl.textContent = data.vma || "?";

        const vo2El = document.getElementById("vo2max");
        if (vo2El) vo2El.textContent = data.vo2max || "?";

        const loadEl = document.getElementById("training-load");
        if (loadEl) loadEl.textContent = data.trainingLoad || "?";

        const trendEl = document.getElementById("performance-trend");
        if (trendEl) trendEl.textContent = data.performanceTrend || "?";

        const activitiesEl = document.getElementById("activities");
        if (activitiesEl && Array.isArray(data.activities)) {
            activitiesEl.innerHTML = "";
            data.activities.forEach(act => {
                const li = document.createElement("li");
                li.textContent = `${new Date(act.date).toLocaleDateString()} - ${act.distance} km - ${act.avgSpeed} km/h - FC ${act.avgHeartRate}`;
                activitiesEl.appendChild(li);
            });
        }
    } catch (error) {
        console.error("❌ Erreur lors du chargement du profil athlète :", error);
    }
}

// Changer le mois affiché
function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    } else if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    loadCalendar(currentYear, currentMonth);
}

// Déconnexion de l'utilisateur
function logout() {
    localStorage.removeItem("jwt");
    window.location.href = "login.html";
}

// Exportation dans le scope global
window.loadAthleteProfile = loadAthleteProfile;
window.changeMonth = changeMonth;
window.logout = logout;
