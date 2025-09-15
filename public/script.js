document.addEventListener("DOMContentLoaded", async () => {
    checkLogin();
    loadCalendar();
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

// Charger et afficher le profil de l'athlète
async function loadAthleteProfile() {
    const token = localStorage.getItem("jwt");
    const sectionId = "athleteProfile";

    let profileSection = document.getElementById(sectionId);
    if (!profileSection) {
        profileSection = document.createElement("section");
        profileSection.id = sectionId;
        profileSection.classList.add("athlete-profile");
        profileSection.innerHTML = `
            <h2>📈 Profil Athlète</h2>
            <div class="athlete-profile__content">Chargement du profil athlète...</div>
        `;

        const calendar = document.getElementById("calendar");
        if (calendar && calendar.parentNode) {
            calendar.parentNode.insertBefore(profileSection, calendar.nextSibling);
        } else {
            document.body.appendChild(profileSection);
        }
    }

    const profileContent = profileSection.querySelector(".athlete-profile__content") || profileSection;

    if (!token) {
        profileContent.textContent = "Connectez-vous pour consulter votre profil athlète.";
        return;
    }

    profileContent.textContent = "Chargement du profil athlète...";

    try {
        const response = await fetch("/api/athlete/profile", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Votre session a expiré, veuillez vous reconnecter.");
            localStorage.removeItem("jwt");
            profileContent.textContent = "Session expirée. Redirection en cours...";
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(`Erreur ${response.status}`);
        }

        const profile = await response.json();
        const formatNumber = (value, decimals = 1) => {
            const number = Number(value);
            return Number.isFinite(number) ? number.toFixed(decimals) : "N/A";
        };

        const trendLabel = profile.performanceTrend > 0
            ? "En progression"
            : profile.performanceTrend < 0
                ? "En baisse"
                : "Stable";

        const trendIcon = profile.performanceTrend > 0
            ? "📈"
            : profile.performanceTrend < 0
                ? "📉"
                : "➖";

        profileContent.innerHTML = `
            <ul class="athlete-profile__stats">
                <li><strong>VMA :</strong> ${formatNumber(profile.vma)} km/h</li>
                <li><strong>VO2 Max :</strong> ${formatNumber(profile.vo2max)} ml/kg/min</li>
                <li><strong>Charge d'entraînement :</strong> ${formatNumber(profile.trainingLoad)} km</li>
                <li><strong>Progression (30j) :</strong> ${formatNumber(profile.progression)} %</li>
                <li><strong>Tendance performances :</strong> ${trendIcon} ${trendLabel}</li>
            </ul>
        `;

        if (!Array.isArray(profile.activities) || profile.activities.length === 0) {
            const message = document.createElement("p");
            message.textContent = "Aucune activité Strava récente trouvée.";
            profileContent.appendChild(message);
        }
    } catch (error) {
        console.error("❌ Erreur lors du chargement du profil athlète :", error);
        profileContent.innerHTML = "<p class=\"error\">Impossible de charger le profil athlète. Veuillez réessayer plus tard.</p>";
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

// Suppression de tous les entraînements de l'utilisateur
async function deleteAllTrainings() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        return;
    }

    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer tous vos entraînements ?");
    if (!confirmation) return;

    try {
        const response = await fetch("/api/deleteAll", {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        alert(data.message || data.error || "Erreur inconnue");

        if (response.ok) {
            loadCalendar();
        }
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des entraînements :", error);
        alert("Erreur lors de la suppression des entraînements.");
    }
}
