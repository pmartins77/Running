document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

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
        trainings.forEach(training => {
            const dateObj = new Date(training.date);
            const dateStr = dateObj.toISOString().split("T")[0];

            const dayElement = document.querySelector(`[data-date='${dateStr}']`);
            if (dayElement) {
                dayElement.classList.add("has-training");
                dayElement.addEventListener("click", () => showTrainingDetails(training));
            }
        });
    }

    function showTrainingDetails(training) {
        alert(`📅 Entraînement du ${training.date}: ${training.type}, ${training.duration} minutes`);
    }

    getTrainings();
});
