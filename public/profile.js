document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadUserProfile();
});

// ✅ Vérifier la connexion utilisateur
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
    .then(response => {
        if (response.status === 401 || response.status === 403) {
            alert("Votre session a expiré, veuillez vous reconnecter.");
            localStorage.removeItem("jwt");
            window.location.href = "login.html";
        }
    })
    .catch(error => {
        console.error("❌ Erreur de vérification du token :", error);
    });
}

// ✅ Charger les informations utilisateur depuis la base de données
async function loadUserProfile() {
    const token = localStorage.getItem("jwt");

    if (!token) return;

    try {
        console.log("📌 Chargement du profil utilisateur...");

        const response = await fetch("/api/user/profile", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la récupération du profil.");
        }

        const user = await response.json();
        displayUserProfile(user);
    } catch (error) {
        console.error("❌ Erreur lors du chargement du profil utilisateur :", error);
    }
}

// ✅ Afficher les données utilisateur dans le formulaire
function displayUserProfile(user) {
    document.getElementById("prenom").value = user.prenom || "";
    document.getElementById("nom").value = user.nom || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("sexe").value = user.sexe || "Homme";
    document.getElementById("telephone").value = user.telephone || "";
    document.getElementById("objectif").value = user.objectif || "";
    document.getElementById("autres").value = user.autres || "";

    // ✅ Vérification et formatage des dates
    if (user.date_de_naissance) {
        document.getElementById("date_naissance").value = new Date(user.date_de_naissance).toISOString().split("T")[0];
    } else {
        document.getElementById("date_naissance").value = "";
    }

    if (user.date_objectif) {
        document.getElementById("date_objectif").value = new Date(user.date_objectif).toISOString().split("T")[0];
    } else {
        document.getElementById("date_objectif").value = "";
    }
}



    // ✅ Gestion du bouton Strava
    const stravaButton = document.getElementById("stravaButton");
    if (user.strava_id) {
        stravaButton.textContent = "🔌 Déconnecter Strava";
        stravaButton.onclick = () => disconnectStrava();
    } else {
        stravaButton.textContent = "🔗 Connecter Strava";
        stravaButton.onclick = () => connectStrava();
    }
}

// ✅ Connexion à Strava
function connectStrava() {
    const token = localStorage.getItem("jwt");

    fetch("/api/strava/connect", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.auth_url) {
            window.location.href = data.auth_url;
        }
    })
    .catch(error => {
        console.error("❌ Erreur lors de la connexion à Strava :", error);
    });
}

// ✅ Déconnexion de Strava
function disconnectStrava() {
    const token = localStorage.getItem("jwt");

    fetch("/api/strava/disconnect", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadUserProfile(); // Rafraîchir le profil après déconnexion
    })
    .catch(error => {
        console.error("❌ Erreur lors de la déconnexion de Strava :", error);
    });
}

// ✅ Supprimer le compte utilisateur
function deleteAccount() {
    if (!confirm("⚠️ Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible !")) {
        return;
    }

    const token = localStorage.getItem("jwt");

    fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        alert("✅ Compte supprimé avec succès !");
        localStorage.removeItem("jwt");
        window.location.href = "signup.html";
    })
    .catch(error => {
        console.error("❌ Erreur lors de la suppression du compte :", error);
        alert("Erreur lors de la suppression du compte.");
    });
}
