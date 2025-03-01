document.addEventListener("DOMContentLoaded", loadUserProfile);

async function loadUserProfile() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const response = await fetch("/api/user/profile", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        alert("Erreur lors du chargement du profil.");
        return;
    }

    const user = await response.json();
    document.getElementById("prenom").value = user.prenom;
    document.getElementById("nom").value = user.nom;
    document.getElementById("email").value = user.email;
    document.getElementById("sexe").value = user.sexe;
    document.getElementById("date_naissance").value = user.date_naissance;
    document.getElementById("telephone").value = user.telephone;
    document.getElementById("objectif").value = user.objectif;
    document.getElementById("date_objectif").value = user.date_objectif;
    document.getElementById("autres").value = user.autres;
}

async function updateProfile() {
    const token = localStorage.getItem("jwt");

    const userData = {
        nom: document.getElementById("nom").value,
        prenom: document.getElementById("prenom").value,
        email: document.getElementById("email").value,
        sexe: document.getElementById("sexe").value,
        date_naissance: document.getElementById("date_naissance").value,
        telephone: document.getElementById("telephone").value,
        objectif: document.getElementById("objectif").value,
        date_objectif: document.getElementById("date_objectif").value,
        autres: document.getElementById("autres").value
    };

    await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(userData)
    });

    alert("Profil mis à jour !");
}
