document.addEventListener("DOMContentLoaded", function () {
    const calendar = document.getElementById("calendar");
    const currentMonth = document.getElementById("currentMonth");
    const trainingTitle = document.getElementById("training-title");
    const trainingInfo = document.getElementById("training-info");

    let currentDate = new Date();
    
    function renderCalendar() {
        calendar.innerHTML = "";
        currentMonth.textContent = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

        let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        let daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            let emptyDiv = document.createElement("div");
            calendar.appendChild(emptyDiv);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            let dayDiv = document.createElement("div");
            dayDiv.classList.add("day");
            dayDiv.textContent = day;
            dayDiv.onclick = () => showTraining(day);
            calendar.appendChild(dayDiv);
        }
    }

    function showTraining(day) {
        trainingTitle.textContent = `Programme du ${day}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
        trainingInfo.textContent = "Séance d'entraînement prévue..."; // Peut être remplacé avec des données
    }

    document.getElementById("prevMonth").onclick = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };

    document.getElementById("nextMonth").onclick = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };

    renderCalendar();
});
