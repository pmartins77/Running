document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Récupérer les infos utilisateur
    async function getUserInfo() {
        const response = await fetch("/api/user/profile", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const user = await response.json();
        
        document.getElementById("prenom").value = user.prenom || "";
        document.getElementById("nom").value = user.nom || "";
        document.getElementById("date_naissance").value = user.date_naissance || "";
        document.getElementById("objectif").value = user.objectif || "";
        document.getElementById("date_objectif").value = user.date_objectif || "";
    }

    getUserInfo();

    // Modifier les infos utilisateur
    document.getElementById("profileForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const userData = {
            prenom: document.getElementById("prenom").value,
            nom: document.getElementById("nom").value,
            date_naissance: document.getElementById("date_naissance").value,
            objectif: document.getElementById("objectif").value,
            date_objectif: document.getElementById("date_objectif").value
        };

        const response = await fetch("/api/user/update", {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert("Profil mis à jour !");
        } else {
            alert("Erreur lors de la mise à jour.");
        }
    });

    // Supprimer le compte
    document.getElementById("deleteAccount").addEventListener("click", async () => {
        if (confirm("Voulez-vous vraiment supprimer votre compte ?")) {
            await fetch("/api/user/delete", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            localStorage.removeItem("token");
            window.location.href = "signup.html";
        }
    });

    // Connexion / Déconnexion Strava
    document.getElementById("connectStrava").addEventListener("click", () => {
        window.location.href = "/api/strava/connect";
    });

    document.getElementById("disconnectStrava").addEventListener("click", async () => {
        await fetch("/api/strava/disconnect", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });

        alert("Compte Strava déconnecté.");
        getUserInfo();
    });
});
