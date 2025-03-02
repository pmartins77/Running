document.addEventListener("DOMContentLoaded", () => {
    loadCalendar();
    checkUserStatus();
});

// ✅ Vérifier si l'utilisateur est connecté
function checkUserStatus() {
    const token = localStorage.getItem("jwt");
    const logoutButton = document.getElementById("logoutButton");

    if (!token) {
        alert("Vous devez être connecté !");
        window.location.href = "login.html";
        return;
    }

    fetch("/api/user/profile", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Impossible de récupérer le profil utilisateur.");
        }
        return response.json();
    })
    .then(user => {
        document.getElementById("welcomeMessage").textContent = `Bienvenue, ${user.prenom} !`;
        logoutButton.style.display = "block";
    })
    .catch(error => {
        console.error("❌ Erreur lors de la récupération du profil utilisateur :", error);
    });
}

// ✅ Déconnexion
function logout() {
    localStorage.removeItem("jwt");
    window.location.href = "login.html";
}

// ✅ Charger le calendrier des entraînements
function loadCalendar() {
    const calendarDiv = document.getElementById("calendar");

    if (!calendarDiv) {
        console.error("❌ Erreur : élément 'calendar' introuvable.");
        return;
    }

    fetch("/api/getTrainings", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des entraînements.");
        }
        return response.json();
    })
    .then(trainings => {
        calendarDiv.innerHTML = ""; // Nettoyage avant affichage

        if (trainings.length === 0) {
            calendarDiv.innerHTML = "<p>Aucun entraînement enregistré.</p>";
            return;
        }

        trainings.forEach(training => {
            const trainingDiv = document.createElement("div");
            trainingDiv.classList.add("training-entry");
            trainingDiv.innerHTML = `
                <p><strong>${new Date(training.date).toLocaleDateString()}</strong> - ${training.name} (${training.distance} km)</p>
            `;
            calendarDiv.appendChild(trainingDiv);
        });
    })
    .catch(error => {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
    });
}

// ✅ Changer de mois
function changeMonth(direction) {
    const currentMonthSpan = document.getElementById("currentMonth");

    let currentMonth = new Date().getMonth() + direction;
    let currentYear = new Date().getFullYear();

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    currentMonthSpan.textContent = `${new Date(currentYear, currentMonth).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`;
    loadCalendar();
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
