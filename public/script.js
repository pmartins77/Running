document.addEventListener("DOMContentLoaded", async () => {
    checkLogin();
    loadCalendar();
    loadAthleteProfile();

    // ✅ Vérification de l'existence du bouton avant d'ajouter un eventListener
    const generatePlanButton = document.getElementById("generate-plan");
    if (generatePlanButton) {
        generatePlanButton.addEventListener("click", () => {
            window.location.href = "plan.html";
        });
    }
});

// ✅ Vérification de l'authentification
function checkLogin() {
    const token = localStorage.getItem("jwt");

    if (!token) {
        alert("Vous devez être connecté !");
        window.location.href = "login.html";
        return;
    }

    fetch("/api/auth/user", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(user => {
        if (!user.id) {
            alert("Votre session a expiré, veuillez vous reconnecter.");
            localStorage.removeItem("jwt");
            window.location.href = "login.html";
        } else {
            document.getElementById("logoutButton").style.display = "inline-block";
        }
    })
    .catch(error => {
        console.error("❌ Erreur de vérification du token :", error);
    });
}

// ✅ Déconnexion
function logout() {
    localStorage.removeItem("jwt");
    alert("Vous avez été déconnecté.");
    window.location.href = "login.html";
}

// ✅ Chargement du profil athlète
async function loadAthleteProfile() {
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

        // ✅ Vérification et mise à jour des valeurs
        if (document.getElementById("vma")) {
            document.getElementById("vma").textContent = data.vma ? `${data.vma.toFixed(1)} km/h` : "Non défini";
        }
        if (document.getElementById("vo2max")) {
            document.getElementById("vo2max").textContent = data.vo2max ? data.vo2max.toFixed(1) : "Non calculé";
        }
        if (document.getElementById("training-load")) {
            document.getElementById("training-load").textContent = data.trainingLoad ? `${data.trainingLoad} km (7j) / ${data.progression}%` : "Non disponible";
        }
        if (document.getElementById("performance-trend")) {
            document.getElementById("performance-trend").textContent = data.performanceTrend > 0 ? "En amélioration" : "En baisse";
        }

    } catch (error) {
        console.error("❌ Erreur lors du chargement du profil athlète :", error);
    }
}
