
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const calendar = document.getElementById("calendar");
    const currentMonth = document.getElementById("currentMonth");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");
    const trainingDetails = document.getElementById("trainingDetails");
    const selectedDate = document.getElementById("selectedDate");

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
                    if (parts.length >= 2) {
                        const date = parts[0].trim();
                        const session = parts.slice(1).join(",").trim();
                        trainingData[date] = session; // Remplace ou ajoute les nouvelles données
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
        trainingDetails.innerHTML = trainingData[date] ? `<strong>${trainingData[date]}</strong>` : "Aucun entraînement prévu";
    }

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
