document.addEventListener("DOMContentLoaded", async () => {
    checkLogin(); // ✅ Vérification de l'authentification
    loadCalendar(); // ✅ Chargement du calendrier
    loadAthleteProfile(); // ✅ Chargement du profil athlète

    // ✅ Correction : Ajout de l'événement pour "Générer mon Plan"
    document.getElementById("generate-plan").addEventListener("click", () => {
        window.location.href = "plan.html";
    });
});

// ✅ Vérifier la connexion utilisateur et rediriger si besoin
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

// ✅ Déconnexion de l'utilisateur
function logout() {
    localStorage.removeItem("jwt");
    alert("Vous avez été déconnecté.");
    window.location.href = "login.html";
}

// ✅ Charger le profil athlète et les activités Strava
async function loadAthleteProfile() {
    try {
        const response = await fetch("/api/athlete/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("jwt")}`
            }
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la récupération du profil.");
        }

        const data = await response.json();

        // ✅ Correction : Vérification des valeurs pour éviter "undefined"
        document.getElementById("vma").textContent = data.vma ? `${data.vma.toFixed(1)} km/h` : "Non défini";
        document.getElementById("vo2max").textContent = data.vo2max ? data.vo2max.toFixed(1) : "Non calculé";
        document.getElementById("training-load").textContent = data.trainingLoad ? `${data.trainingLoad} km (7j) / ${data.progression}%` : "Non disponible";
        document.getElementById("performance-trend").textContent = data.performanceTrend > 0 ? "En amélioration" : "En baisse";

        // ✅ Mise à jour des activités Strava
        const activityList = document.getElementById("activities");
        if (activityList) {
            activityList.innerHTML = ""; // Nettoyer avant d'ajouter
            data.activities.forEach(activity => {
                const li = document.createElement("li");
                li.textContent = `${activity.date} - ${activity.distance} km - ${activity.avgSpeed} km/h - FC Moyenne: ${activity.avgHeartRate}`;
                activityList.appendChild(li);
            });
        }

    } catch (error) {
        console.error("❌ Erreur lors du chargement du profil athlète :", error);
    }
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

    calendarDiv.innerHTML = ""; // Nettoyage avant affichage

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

// ✅ Afficher les détails d'un entraînement avec TOUS les champs et conseils
function showTrainingDetails(training) {
    const detailsDiv = document.getElementById("trainingDetails");
    detailsDiv.innerHTML = `
        <h3>📋 Détails de l'entraînement</h3>
        <p><strong>Date :</strong> ${new Date(training.date).toLocaleDateString()}</p>
        <p><strong>Échauffement :</strong> ${training.echauffement || "?"}</p>
        <p><strong>Type :</strong> ${training.type || "?"}</p>
        <p><strong>Durée :</strong> ${training.duration || "?"} min</p>
        <p><strong>Intensité :</strong> ${training.intensity || "?"}</p>
        <p><strong>Détails :</strong> ${training.details || "?"}</p>
        <p><strong>Récupération :</strong> ${training.recuperation || "?"}</p>
        <p><strong>Fréquence cardiaque cible :</strong> ${training.fc_cible || "?"}</p>
        <p><strong>Objectif :</strong> ${training.nom_objectif || "Aucun objectif associé"}</p>
        <p><strong>Conseil :</strong> ${training.conseil || "Pensez à bien vous hydrater et vous étirer après la séance."}</p>
    `;
}
