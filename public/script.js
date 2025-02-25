document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadCalendar();
});

// 1️⃣ **Vérifier la connexion et éviter les redirections inutiles**
function checkLogin() {
    const token = localStorage.getItem("jwt");

    if (!token) {
        alert("Vous devez être connecté !");
        window.location.href = "login.html";
        return;
    }

    // ✅ Vérification côté serveur que le token est encore valide
    fetch("/api/auth/verify", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Votre session a expiré, veuillez vous reconnecter.");
            localStorage.removeItem("jwt");
            window.location.href = "login.html";
        }
    })
    .catch(error => {
        console.error("❌ Erreur de vérification du token :", error);
    });
}

// 2️⃣ **Déconnexion propre**
function logout() {
    localStorage.removeItem("jwt");
    alert("Vous avez été déconnecté.");
    window.location.href = "login.html";
}

// 3️⃣ **Charger le calendrier**
async function loadCalendar() {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
        const response = await fetch(`/api/getTrainings?token=${token}`);
        const trainings = await response.json();

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

// 4️⃣ **Changer de mois**
async function changeMonth(offset) {
    console.log(`Changement de mois : ${offset}`);
}

// 5️⃣ **Importer un fichier CSV**
async function uploadCSV() {
    const fileInput = document.getElementById("csvFileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const formData = new FormData();
    formData.append("csv", file);

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        alert(result.message || "Importation réussie !");
        loadCalendar(); // Recharger le calendrier après l'import
    } catch (error) {
        console.error("❌ Erreur lors de l'importation du CSV :", error);
        alert("Erreur lors de l'importation du fichier.");
    }
}
