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

            if (response.status === 403) {
                alert("Votre session a expiré. Veuillez vous reconnecter.");
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }

            const trainings = await response.json();
            updateCalendar(trainings);
        } catch (error) {
            console.error("❌ Erreur lors du chargement des entraînements :", error);
        }
    }

    function updateCalendar(trainings) {
        const calendar = document.getElementById("calendar");
        calendar.innerHTML = "";

        document.getElementById("currentMonth").textContent =
            currentDate.toLocaleString("fr-FR", { month: "long", year: "numeric" });

        for (let day = 1; day <= 31; day++) {
            const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            const dayElement = document.createElement("div");
            dayElement.classList.add("day");
            dayElement.innerText = day;

            if (trainings.some(t => t.date.split("T")[0] === dateStr)) {
                dayElement.classList.add("has-training");
                dayElement.addEventListener("click", () => showTrainingDetails(dateStr, trainings));
            }

            calendar.appendChild(dayElement);
        }
    }

    function showTrainingDetails(date, trainings) {
        const training = trainings.find(t => t.date.split("T")[0] === date);
        const detailsElement = document.getElementById("training-info");

        if (training) {
            detailsElement.innerHTML = `
                <strong>Type:</strong> ${training.type} <br>
                <strong>Durée:</strong> ${training.duration} minutes <br>
                <strong>Intensité:</strong> ${training.intensity} <br>
                <strong>Détails:</strong> ${training.details}
            `;
        } else {
            detailsElement.innerText = "Aucun entraînement pour ce jour.";
        }
    }

    function logout() {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    }

    getTrainings();
});
