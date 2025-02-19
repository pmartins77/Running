
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const calendar = document.getElementById("calendar");
    const currentMonth = document.getElementById("currentMonth");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");
    const trainingDetails = document.getElementById("trainingDetails");
    const selectedDate = document.getElementById("selectedDate");

    let trainingData = {};
    let currentYear = new Date().getFullYear();
    let currentMonthIndex = new Date().getMonth();

    function loadCalendar() {
        calendar.innerHTML = "";
        const firstDay = new Date(currentYear, currentMonthIndex, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

        currentMonth.textContent = new Date(currentYear, currentMonthIndex).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement("div");
            dayElement.classList.add("calendar-day");
            dayElement.textContent = day;
            
            let dateKey = `${day}/${currentMonthIndex + 1}/${currentYear}`;
            if (trainingData[dateKey]) {
                dayElement.classList.add("has-training");
            }

            dayElement.addEventListener("click", function () {
                selectedDate.textContent = `Programme du ${dateKey}`;
                trainingDetails.textContent = trainingData[dateKey] || "Aucun entraînement prévu";
            });

            calendar.appendChild(dayElement);
        }
    }

    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const lines = e.target.result.split("\n");
                trainingData = {};

                lines.forEach(line => {
                    const parts = line.split(",");
                    if (parts.length === 2) {
                        const date = parts[0].trim();
                        const session = parts[1].trim();
                        trainingData[date] = session;
                    }
                });

                loadCalendar();
            };
            reader.readAsText(file);
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
