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

        document.getElementById("currentMonth").textContent =
            currentDate.toLocaleString("fr-FR", { month: "long", year: "numeric" });

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

    window.deleteAllTrainings = function() {
        fetch("/api/deleteAll", {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(() => {
            alert("🗑 Tous les entraînements ont été supprimés !");
            getTrainings();
        })
        .catch(error => {
            console.error("❌ Erreur lors de la suppression :", error);
            alert("❌ Erreur lors de la suppression.");
        });
    }

    window.previousMonth = function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        getTrainings();
    }

    window.nextMonth = function(
