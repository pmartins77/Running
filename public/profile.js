// ✅ Convertir YYYY-MM-DD (base) → JJ/MM/AAAA (affichage)
function formatDateToDisplay(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// ✅ Convertir JJ/MM/AAAA (affichage) → YYYY-MM-DD (pour base de données)
function formatDateToDB(dateString) {
    if (!dateString) return null;
    const parts = dateString.split("/");
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// ✅ Charger le profil utilisateur
async function loadUserProfile() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("/api/user/profile", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Erreur lors du chargement du profil");

        const user = await response.json();

        // Remplir les champs du formulaire avec les valeurs existantes
        document.getElementById("nom").value = user.nom || "";
        document.getElementById("prenom").value = user.prenom || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("telephone").value = user.telephone || "";
        document.getElementById("sexe").value = user.sexe || "Autre";
        document.getElementById("date_naissance").value = formatDateToDisplay(user.date_de_naissance);
        document.getElementById("date_objectif").value = formatDateToDisplay(user.date_objectif);
        document.getElementById("objectif").value = user.objectif || "";
        document.getElementById("autres").value = user.autres || "";

        // ✅ Vérifier la connexion Strava et mettre à jour le bouton
        updateStravaButton(user.strava_id);
    } catch (error) {
        console.error("❌ Erreur récupération profil :", error);
        alert("Impossible de récupérer les informations du profil.");
    }
}

// ✅ Mettre à jour l'affichage du bouton Strava
function updateStravaButton(stravaId) {
    const stravaButton = document.getElementById("stravaButton");
    if (stravaId) {
        stravaButton.textContent = "❌ Déconnecter Strava";
        stravaButton.onclick = disconnectStrava;
    } else {
        stravaButton.textContent = "🔗 Connecter Strava";
        stravaButton.onclick = connectStrava;
    }
}

// ✅ Connexion à Strava
function connectStrava() {
    window.location.href = "/api/strava/auth";
}

// ✅ Déconnexion de Strava
async function disconnectStrava() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        return;
    }

    try {
        const response = await fetch("/api/strava/disconnect", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Erreur lors de la déconnexion de Strava");

        alert("Votre compte Strava a été déconnecté !");
        loadUserProfile(); // Recharger le profil pour mettre à jour l'affichage
    } catch (error) {
        console.error("❌ Erreur déconnexion Strava :", error);
        alert("Impossible de déconnecter Strava.");
    }
}

// ✅ Soumettre les mises à jour du profil
async function updateUserProfile(event) {
    event.preventDefault();

    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté !");
        window.location.href = "login.html";
        return;
    }

    const userData = {
        nom: document.getElementById("nom").value,
        prenom: document.getElementById("prenom").value,
        email: document.getElementById("email").value,
        telephone: document.getElementById("telephone").value,
        sexe: document.getElementById("sexe").value,
        date_de_naissance: formatDateToDB(document.getElementById("date_naissance").value),
        date_objectif: formatDateToDB(document.getElementById("date_objectif").value),
        objectif: document.getElementById("objectif").value,
        autres: document.getElementById("autres").value
    };

    try {
        const response = await fetch("/api/user/profile", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw new Error("Erreur lors de la mise à jour du profil");

        alert("Profil mis à jour avec succès !");
    } catch (error) {
        console.error("❌ Erreur mise à jour profil :", error);
        alert("Impossible de mettre à jour le profil.");
    }
}

// Charger les infos au chargement de la page
document.addEventListener("DOMContentLoaded", loadUserProfile);
// Associer la soumission du formulaire à updateUserProfile
document.getElementById("profileForm").addEventListener("submit", updateUserProfile);
