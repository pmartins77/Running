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
        generateCalendar(year, month, trainings);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
        alert("Erreur lors du chargement des entraînements.");
    }
}

// 4️⃣ **Afficher les détails d'un entraînement**
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

// 5️⃣ **Supprimer tous les entraînements**
function deleteAllTrainings() {
    fetch("/api/deleteAll", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("jwt")}` }
    })
    .then(() => {
        alert("🗑️ Tous les entraînements ont été supprimés !");
        loadCalendar(currentYear, currentMonth);
    })
    .catch(error => {
        console.error("❌ Erreur lors de la suppression :", error);
    });
}
