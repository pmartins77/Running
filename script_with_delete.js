
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const calendar = document.getElementById("calendar");
    const currentMonth = document.getElementById("currentMonth");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");
    const trainingDetails = document.getElementById("trainingDetails");
    const selectedDate = document.getElementById("selectedDate");
    const deleteButton = document.getElementById("deletePlan");

    let trainingData = JSON.parse(localStorage.getItem("trainingData")) || {};
    let currentYear = new Date().getFullYear();
    let currentMonthIndex = new Date().getMonth();

    function saveTrainingData() {
        localStorage.setItem("trainingData", JSON.stringify(trainingData));
    }

    function loadCalendar() {
        calendar.innerHTML = "";
        const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

        currentMonth.textContent = new Date(currentYear, currentMonthIndex).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

        for (let day = 1; day <= daysInMonth; day++) {
            let dayElement = document.createElement("div");
            dayElement.classList.add("calendar-day");
            dayElement.textContent = day;

            let dateKey = `${day.toString().padStart(2, '0')}/${(currentMonthIndex + 1).toString().padStart(2, '0')}/${currentYear}`;

            if (trainingData[dateKey]) {
                dayElement.classList.add("has-training");
            }

            dayElement.addEventListener("click", function () {
                displayTraining(dateKey);
            });

            calendar.appendChild(dayElement);
        }
    }

    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const lines = e.target.result.split("\n").map(line => line.trim()).filter(line => line.length > 0);

                lines.forEach(line => {
                    const parts = line.split(",");
                    if (parts.length >= 5) {
                        const date = parts[0].trim();
                        const echauffement = parts[1].trim();
                        const seance = parts[2].trim();
                        const recuperation = parts[3].trim();
                        const conseils = parts[4].trim();

                        trainingData[date] = {
                            echauffement: echauffement,
                            seance: seance,
                            recuperation: recuperation,
                            conseils: conseils
                        };
                    }
                });

                saveTrainingData();
                loadCalendar();
            };
            reader.readAsText(file);
        }
    });

    function displayTraining(date) {
        selectedDate.textContent = `Programme du ${date}`;
        if (trainingData[date]) {
            trainingDetails.innerHTML = `
                <strong>Échauffement :</strong> ${trainingData[date].echauffement}<br>
                <strong>Entraînement :</strong> ${trainingData[date].seance}<br>
                <strong>Récupération :</strong> ${trainingData[date].recuperation}<br>
                <strong>Conseils :</strong> ${trainingData[date].conseils}
            `;
        } else {
            trainingDetails.innerHTML = "Aucun entraînement prévu";
        }
    }

    deleteButton.addEventListener("click", function () {
        if (confirm("Voulez-vous vraiment supprimer l'ensemble du plan d'entraînement ? Cette action est irréversible.")) {
            localStorage.removeItem("trainingData");
            trainingData = {};
            loadCalendar();
            trainingDetails.innerHTML = "Séance d'entraînement prévue...";
            selectedDate.textContent = "";
            alert("Plan d'entraînement supprimé avec succès.");
        }
    });

    prevMonth.addEventListener("click", function () {
        currentMonthIndex--;
        if (currentMonthIndex < 0) {
            currentMonthIndex = 11;
            currentYear--;
        }
        loadCalendar();
    });

    nextMonth.addEventListener("click", function () {
        currentMonthIndex++;
        if (currentMonthIndex > 11) {
            currentMonthIndex = 0;
            currentYear++;
        }
        loadCalendar();
    });

    loadCalendar();
});
