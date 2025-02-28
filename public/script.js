document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    let currentDate = new Date();

    async function getTrainings() {
        try {
            const response = await fetch("/api/getTrainings", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                console.warn("⚠️ Erreur lors du chargement des entraînements.");
                return;
            }

            const trainings = await response.json();
            console.log("✅ Entraînements chargés :", trainings);

            updateCalendar(trainings);
        } catch (error) {
            console.error("❌ Erreur lors du chargement des entraînements :", error);
        }
    }

    function updateCalendar(trainings) {
        const calendar = document.getElementById("calendar");
        calendar.innerHTML = "";

        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        for (let day = 1; day <= 31; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            const dayElement = document.createElement("div");
            dayElement.classList.add("day");
            dayElement.innerText = day;
            dayElement.dataset.date = dateStr;

            const hasTraining = trainings.some(t => t.date.split("T")[0] === dateStr);
            if (hasTraining) {
                dayElement.classList.add("has-training");
                dayElement.addEventListener("click", () => showTrainingDetails(dateStr, trainings));
            }

            calendar.appendChild(dayElement);
        }
    }

    function showTrainingDetails(date, trainings) {
        const training = trainings.find(t => t.date.split("T")[0] === date);
        if (training) {
            alert(`📅 Entraînement du ${date}: ${training.type}, ${training.duration} minutes`);
        }
    }

    function loadCSV() {
        alert("📂 Fonction de chargement CSV à implémenter.");
    }

    function deleteAllTrainings() {
        alert("🗑 Fonction de suppression des entraînements à implémenter.");
    }

    function previousMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        getTrainings();
    }

    function nextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        getTrainings();
    }

    getTrainings();
});
