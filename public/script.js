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

// ✅ Correction : Forcer le rechargement du calendrier après la génération du plan
document.getElementById("generate-plan").addEventListener("click", async () => {
    const response = await fetch("/api/plan/generate", { 
        method: "POST", 
        headers: { "Authorization": `Bearer ${localStorage.getItem("jwt")}` } 
    });

    const data = await response.json();

    if (data.success) {
        alert("✅ Plan d'entraînement généré avec succès !");
        console.log("📌 Rechargement du calendrier après la génération...");
        loadCalendar(); // 🔥 Assurer que le calendrier est bien mis à jour
    } else {
        alert("❌ Erreur lors de la génération du plan.");
    }
});
