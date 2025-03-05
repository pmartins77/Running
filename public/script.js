document.addEventListener("DOMContentLoaded", async () => {
    checkLogin(); // ✅ Vérification de l'authentification
    loadCalendar(); // ✅ Chargement du calendrier
    loadAthleteProfile(); // ✅ Chargement du profil athlète

    // ✅ Ajout du listener sur le bouton "Générer un Plan"
    const generatePlanButton = document.getElementById("generate-plan");
    if (generatePlanButton) {
        generatePlanButton.addEventListener("click", () => {
            window.location.href = "plan.html"; // ✅ Redirige vers la page de création du plan
        });
    }
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

        // ✅ Vérification et mise à jour des éléments HTML (évite les erreurs si les éléments ne sont pas présents)
        if (document.getElementById("vma")) {
            document.getElementById("vma").textContent = data.vma ? `${data.vma.toFixed(1)} km/h` : "Non défini";
        }
        if (document.getElementById("vo2max")) {
            document.getElementById("vo2max").textContent = data.vo2max ? data.vo2max.toFixed(1) : "Non calculé";
        }
        if (document.getElementById("training-load")) {
            document.getElementById("training-load").textContent = data.trainingLoad ? `${data.trainingLoad} km (7j) / ${data.progression}%` : "Non disponible";
        }
        if (document.getElementById("performance-trend")) {
            document.getElementById("performance-trend").textContent = data.performanceTrend > 0 ? "En amélioration" : "En baisse";
        }

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
