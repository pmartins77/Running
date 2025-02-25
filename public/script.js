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

    // ✅ Vérification côté serveur que le token est valide
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

// 3️⃣ **Charger le calendrier avec les paramètres requis**
async function loadCalendar() {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Mois en JS commence à 0

    try {
        const response = await fetch(`/api/getTrainings?year=${year}&month=${month}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Erreur API : ${response.statusText}`);
        }

        const trainings = await response.json();

        if (!Array.isArray(trainings)) {
            throw new Error("Données invalides reçues du serveur");
        }

        const calendarDiv = document.getElementById("calendar");
        calendarDiv.innerHTML = ""; // Nettoyer avant affichage

        if (trainings.length === 0) {
            calendarDiv.innerHTML = "<p>Aucun entraînement prévu.</p>";
            return;
        }

        trainings.forEach(training => {
            const trainingElement = document.createElement("p");
            trainingElement.textContent = `${new Date(training.date).toLocaleDateString()} - ${training.details}`;
            calendarDiv.appendChild(trainingElement);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
        alert("Erreur lors du chargement des entraînements.");
    }
}
