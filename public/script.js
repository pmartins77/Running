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
        if (!response.ok) {
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

// 3️⃣ **Charger le calendrier**
async function loadCalendar() {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

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

        generateCalendar(year, month, trainings);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
        alert("Erreur lors du chargement des entraînements.");
    }
}

// 4️⃣ **Importation de fichiers CSV**
async function uploadCSV() {
    const fileInput = document.getElementById("csvFileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            const token = localStorage.getItem("jwt");

            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(jsonData)
            });

            const data = await response.json();
            alert(data.message);
            loadCalendar(); // Recharger les entraînements après import
        } catch (error) {
            console.error("❌ Erreur lors de l'importation du CSV :", error);
            alert("Erreur lors de l'importation du fichier.");
        }
    };

    reader.readAsText(file);
}
