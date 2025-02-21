document.addEventListener("DOMContentLoaded", function () {
    loadCalendar();
});

function loadCalendar() {
    const calendar = document.getElementById("calendar");
    if (!calendar) {
        console.error("❌ Erreur : L'élément #calendar est introuvable.");
        return;
    }
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    updateCalendar(currentMonth, currentYear);
}

function updateCalendar(month, year) {
    const calendar = document.getElementById("calendar");
    const currentMonthElement = document.getElementById("currentMonth");

    if (!calendar || !currentMonthElement) {
        console.error("❌ Erreur : Élément introuvable dans le DOM.");
        return;
    }

    currentMonthElement.textContent = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    calendar.innerHTML = "";
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        let dayElement = document.createElement("button");
        dayElement.textContent = day;
        dayElement.onclick = function () { fetchTrainingDetails(day, month + 1, year); };
        calendar.appendChild(dayElement);
    }
}

function changeMonth(direction) {
    const currentMonthElement = document.getElementById("currentMonth").textContent;
    let [month, year] = currentMonthElement.split(" ");
    let monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth();
    let yearNumber = parseInt(year);

    monthIndex += direction;
    if (monthIndex < 0) { monthIndex = 11; yearNumber--; }
    if (monthIndex > 11) { monthIndex = 0; yearNumber++; }

    updateCalendar(monthIndex, yearNumber);
}

function fetchTraini
