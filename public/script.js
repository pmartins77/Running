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

// ✅ Variables pour suivre l'année et le mois affichés
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

// ✅ Charger le calendrier avec les entraînements
async function loadCalendar(year = currentYear, month = currentMonth) {
    currentYear = year;
    currentMonth = month;

    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
        console.log(`📌 Chargement des entraînements pour year=${year}, month=${month}`);

        const response = await fetch(`/api/getTrainings?year=${year}&month=${month}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des entraînements.");
        }

        const trainings = await response.json();
        displayCalendar(trainings, year, month);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
    }
}

// ✅ Afficher les entraînements dans le calendrier
function displayCalendar(trainings, year, month) {
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = ""; // Nettoyage avant affichage

    if (trainings.length === 0) {
        calendarDiv.innerHTML = "<p>Aucun entraînement enregistré.</p>";
        return;
    }

    trainings.forEach(training => {
        const trainingDiv = document.createElement("div");
        trainingDiv.classList.add("training-entry");
        trainingDiv.innerHTML = `
            <p><strong>${new Date(training.date).toLocaleDateString()}</strong> - ${training.name || "Entraînement"} (${training.distance || 0} km)</p>
        `;
        calendarDiv.appendChild(trainingDiv);
    });

    // ✅ Mettre à jour le mois affiché
    document.getElementById("currentMonth").textContent =
        new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
}

// ✅ Changer de mois
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

// ✅ Importation d'un fichier CSV
function uploadCSV() {
    const fileInput = document.getElementById("csvFileInput");
    if (!fileInput.files.length) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || "Importation réussie !");
        loadCalendar();
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'importation du fichier CSV :", error);
        alert("Erreur lors de l'importation du fichier CSV.");
    });
}

// ✅ Supprimer tous les entraînements
function deleteAllTrainings() {
    if (!confirm("Voulez-vous vraiment supprimer tous vos entraînements ?")) return;

    fetch("/api/deleteAll", {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || "Tous les entraînements ont été supprimés.");
        loadCalendar();
    })
    .catch(error => {
        console.error("❌ Erreur lors de la suppression des entraînements :", error);
        alert("Erreur lors de la suppression des entraînements.");
    });
}
