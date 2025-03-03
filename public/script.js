// ✅ Définition des variables pour gérer l'affichage du calendrier
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

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
        } else {
            document.getElementById("logoutButton").style.display = "inline-block";
        }
    })
    .catch(error => {
        console.error("❌ Erreur de vérification du token :", error);
    });
}

// ✅ Charger le calendrier des entraînements générés
async function loadCalendar(year = currentYear, month = currentMonth) {
    currentYear = year;
    currentMonth = month;

    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
        console.log(`📌 Chargement des entraînements générés pour ${year}-${month}`);

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
        console.log("📌 Entraînements reçus :", trainings);

        displayCalendar(trainings, year, month);
        displayTrainings(trainings);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
    }
}

// ✅ Fonction pour afficher le calendrier
function displayCalendar(trainings, year, month) {
    console.log("📌 Affichage du calendrier pour", year, month, "avec entraînements :", trainings);

    const calendarDiv = document.getElementById("calendar");
    if (!calendarDiv) {
        console.error("❌ Erreur : l'élément #calendar est introuvable.");
        return;
    }

    calendarDiv.innerHTML = "";
}

// ✅ Afficher les entraînements sous le calendrier
function displayTrainings(trainings) {
    const list = document.getElementById("training-list");
    list.innerHTML = "";

    if (trainings.length === 0) {
        list.innerHTML = "<p>Aucun entraînement généré.</p>";
        return;
    }

    trainings.forEach(session => {
        const item = document.createElement("li");
        item.textContent = `${session.date}: ${session.type} (${session.duration} min) - ${session.intensity}`;
        list.appendChild(item);
    });
}

// ✅ Bouton pour générer un plan
document.getElementById("generate-plan").addEventListener("click", async () => {
    const response = await fetch("/api/plan/generate", { 
        method: "POST", 
        headers: { "Authorization": `Bearer ${localStorage.getItem("jwt")}` } 
    });

    const data = await response.json();

    if (data.success) {
        alert("✅ Plan d'entraînement généré avec succès !");
        loadCalendar();
    } else {
        alert("❌ Erreur lors de la génération du plan.");
    }
});

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

    console.log(`📌 Changement de mois : ${newYear}-${newMonth}`);
    loadCalendar(newYear, newMonth);
}
