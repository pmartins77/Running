document.addEventListener("DOMContentLoaded", () => {
    loadCalendar(); // Charger le calendrier dès l'ouverture de la page
});

// 1️⃣ **Charger le calendrier des entraînements**
async function loadCalendar() {
    const token = localStorage.getItem("jwt");

    if (!token) {
        alert("Vous devez être connecté !");
        return;
    }

    try {
        const response = await fetch(`/api/getTrainings?token=${token}`);
        const trainings = await response.json();

        const calendarDiv = document.getElementById("calendar");
        calendarDiv.innerHTML = ""; // Nettoyer l'affichage

        trainings.forEach(training => {
            const trainingElement = document.createElement("p");
            trainingElement.textContent = `${training.date} - ${training.details}`;
            calendarDiv.appendChild(trainingElement);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement du calendrier :", error);
        alert("Erreur lors du chargement des entraînements.");
    }
}

// 2️⃣ **Changer de mois**
async function changeMonth(offset) {
    console.log(`Changement de mois : ${offset}`);
    // Ici, ajouter la logique pour charger le mois suivant/précédent
}

// 3️⃣ **Importer un fichier CSV**
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
