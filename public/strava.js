"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initStravaPage();
});

async function initStravaPage() {
    attachLogoutHandler();

    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        window.location.href = "login.html";
        return;
    }

    await loadAthleteProfile(token);
}

async function loadAthleteProfile(token) {
    try {
        const response = await fetch("/api/athlete/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Votre session a expiré, veuillez vous reconnecter.");
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erreur lors de la récupération du profil Strava.");
        }

        const data = await response.json();
        updateProfileSummary(data);
        updateActivities(data.activities || []);
    } catch (error) {
        console.error("❌ Erreur lors du chargement des données Strava :", error);
        updateProfileSummary();
        updateActivities([]);
        alert("Impossible de charger les données Strava pour le moment.");
    }
}

function updateProfileSummary(profile = {}) {
    const { vma, vo2max, trainingLoad, performanceTrend, progression } = profile;

    const vmaText = formatNumber(vma, 1);
    const vo2MaxText = formatNumber(vo2max, 0);
    const trainingLoadText = formatNumber(trainingLoad, 1);
    const progressionText = formatNumber(progression, 1);

    setTextContent("vma", vmaText ? `${vmaText}` : "--");
    setTextContent("vo2max", vo2MaxText ? `${vo2MaxText}` : "--");
    setTextContent(
        "training-load",
        trainingLoadText ? `${trainingLoadText} km (7 jours)` : "--"
    );

    let trendMessage = "--";
    if (typeof performanceTrend === "number") {
        if (performanceTrend > 0) {
            trendMessage = "En progression";
        } else if (performanceTrend < 0) {
            trendMessage = "En baisse";
        } else {
            trendMessage = "Stable";
        }

        if (progressionText) {
            const sign = performanceTrend >= 0 ? "+" : "";
            trendMessage += ` (${sign}${progressionText}%)`;
        }
    }
    setTextContent("performance-trend", trendMessage);
}

function updateActivities(activities) {
    const list = document.getElementById("activities");
    if (!list) {
        console.warn("Élément #activities introuvable.");
        return;
    }

    list.innerHTML = "";

    if (!Array.isArray(activities) || activities.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "Aucune activité Strava disponible pour le moment.";
        list.appendChild(emptyItem);
        return;
    }

    activities.forEach(activity => {
        const listItem = document.createElement("li");

        const activityDate = activity.date ? new Date(activity.date) : null;
        const dateText = activityDate && !Number.isNaN(activityDate.valueOf())
            ? activityDate.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            })
            : "Date inconnue";

        const distanceText = formatNumber(activity.distance, 1);
        const speedText = formatNumber(activity.avgSpeed, 1);
        const heartRateRaw = activity.avgHeartRate;
        const heartRateNumber = Number(heartRateRaw);
        const heartRateText = heartRateRaw !== null && heartRateRaw !== undefined && Number.isFinite(heartRateNumber)
            ? `${heartRateNumber.toLocaleString("fr-FR")} bpm`
            : "Fréquence cardiaque N/A";

        const distanceDisplay = distanceText ? `${distanceText} km` : "Distance N/A";
        const speedDisplay = speedText ? `${speedText} km/h` : "Vitesse N/A";

        listItem.innerHTML = `<strong>${dateText}</strong> – ${distanceDisplay} – ${speedDisplay} – ${heartRateText}`;
        list.appendChild(listItem);
    });
}

function setTextContent(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`Élément #${elementId} introuvable.`);
    }
}

function formatNumber(value, fractionDigits = 1) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return null;
    }

    return number.toLocaleString("fr-FR", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    });
}

function attachLogoutHandler() {
    const logoutLink = document.querySelector('a[href="logout.html"]');
    if (logoutLink) {
        logoutLink.addEventListener("click", event => {
            event.preventDefault();
            logout();
        });
    }
}

function logout() {
    localStorage.removeItem("jwt");
    window.location.href = "login.html";
}
