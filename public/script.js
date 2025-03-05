document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/api/athlete/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("jwt")}`
            }
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la récupération du profil.");
        }

        const data = await response.json();

        // ✅ Mise à jour du profil athlète
        document.getElementById("vma").textContent = data.vma.toFixed(1);
        document.getElementById("vo2max").textContent = data.vo2max.toFixed(1);
        document.getElementById("training-load").textContent = data.trainingLoad + " km (7j) / " + data.progression + "%";
        document.getElementById("performance-trend").textContent = data.performanceTrend > 0 ? "En amélioration" : "En baisse";

        // ✅ Mise à jour des activités
        const activityList = document.getElementById("activities");
        activityList.innerHTML = ""; // Nettoyer avant d'ajouter
        data.activities.forEach(activity => {
            const li = document.createElement("li");
            li.textContent = `${activity.date} - ${activity.distance} km - ${activity.avgSpeed} km/h - FC Moyenne: ${activity.avgHeartRate}`;
            activityList.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Erreur :", error);
    }
});
