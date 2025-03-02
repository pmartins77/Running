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

// ✅ Afficher les détails d'un entraînement sous le calendrier
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
    `;
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

// ✅ Correction de l'upload CSV (envoi JSON)
function uploadCSV() {
    const fileInput = document.getElementById("csvFileInput");
    if (!fileInput.files.length) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (event) {
        const csvData = event.target.result;
        const parsedData = parseCSV(csvData);

        if (!parsedData.length) {
            alert("Le fichier CSV est vide ou mal formaté.");
            return;
        }

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("jwt")}`
                },
                body: JSON.stringify(parsedData)
            });

            if (!response.ok) {
                throw new Error("Échec de l'importation du fichier CSV.");
            }

            const data = await response.json();
            console.log("✅ Réponse du serveur :", data);
            alert(data.message || "Importation réussie !");
            loadCalendar();
        } catch (error) {
            console.error("❌ Erreur lors de l'importation du fichier CSV :", error);
            alert("Erreur lors de l'importation du fichier CSV.");
        }
    };

    reader.readAsText(file);
}

// ✅ Correction de la fonction `parseCSV`
function parseCSV(csvText) {
    const rows = csvText.split("\n").map(row => row.trim()).filter(row => row);
    const headers = rows.shift().split(",");

    return rows.map(row => {
        const values = row.split(",");
        let entry = {};
        headers.forEach((header, index) => {
            entry[header.trim()] = values[index] ? values[index].trim() : "";
        });
        return entry;
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
