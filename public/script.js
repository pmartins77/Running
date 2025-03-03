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
        console.log("📌 Entraînements reçus :", trainings);
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

                let trainingInfo = trainings.find(t => {
                    let trainingDate = new Date(t.date);
                    return trainingDate.getUTCFullYear() === year &&
                           trainingDate.getUTCMonth() + 1 === month &&
                           trainingDate.getUTCDate() === dayCount;
                });

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

// ✅ Afficher le formulaire pour générer un plan
function showPlanForm() {
    const modal = document.createElement("div");
    modal.innerHTML = `
        <div id="planModal" class="modal">
            <div class="modal-content">
                <h2>📋 Générer un Plan d'Entraînement</h2>
                <label for="raceType">Type de course :</label>
                <select id="raceType">
                    <option value="5km">5 km</option>
                    <option value="10km">10 km</option>
                    <option value="15km">15 km</option>
                    <option value="20km">20 km</option>
                    <option value="semi">Semi-marathon</option>
                    <option value="marathon">Marathon</option>
                    <option value="100km">100 km</option>
                    <option value="autre">Autre (préciser)</option>
                </select>
                <input type="text" id="customRace" placeholder="Autre course..." style="display: none;">

                <label for="terrain">Type de terrain :</label>
                <select id="terrain">
                    <option value="route">Route</option>
                    <option value="trail">Trail</option>
                </select>

                <label for="eventDate">Date de l'événement :</label>
                <input type="date" id="eventDate">

                <label for="intensity">Intensité :</label>
                <select id="intensity">
                    <option value="conservateur">Conservateur</option>
                    <option value="equilibre">Équilibré</option>
                    <option value="ambitieux">Ambitieux</option>
                </select>

                <button onclick="generatePlan()">✅ Générer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ✅ Génération du plan avec les paramètres utilisateur
async function generatePlan() {
    const raceType = document.getElementById("raceType").value;
    const terrain = document.getElementById("terrain").value;
    const eventDate = document.getElementById("eventDate").value;
    const intensity = document.getElementById("intensity").value;
    
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        return;
    }

    const response = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raceType, terrain, eventDate, intensity })
    });

    const data = await response.json();
    if (data.success) {
        alert("✅ Plan généré !");
        loadCalendar();
    } else {
        alert("❌ Erreur.");
    }
}

document.getElementById("generate-plan").addEventListener("click", showPlanForm);
