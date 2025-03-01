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
            }

            calendar.appendChild(dayElement);
        }
    }

    function logout() {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    }

    function deleteAllTrainings() {
        fetch("/api/deleteAll", {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(() => {
            alert("🗑 Tous les entraînements ont été supprimés !");
            getTrainings();
        });
    }

    window.previousMonth = function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        getTrainings();
    }

    window.nextMonth = function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        getTrainings();
    }

    getTrainings();
});
