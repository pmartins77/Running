document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadCalendar();
});

// 1️⃣ **Vérifier la connexion**
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
        if (!response.ok) {
            throw new Error("Session expirée ou invalide");
        }
        return response.json();
    })
    .then(user => {
        console.log("✅ Utilisateur authentifié :", user);
    })
    .catch(error => {
        console.error("❌ Erreur de vérification du token :", error);
        alert("Votre session a expiré, veuillez vous reconnecter.");
        localStorage.removeItem("jwt");
        window.location.href = "login.html";
    });
}
