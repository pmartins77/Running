document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("⚠️ Aucun token trouvé, redirection vers login.");
        window.location.href = "login.html";
        return;
    }

    async function getUserInfo() {
        try {
            const response = await fetch("/api/auth/user", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.status === 404) {
                console.warn("⚠️ Utilisateur non trouvé.");
                return;
            }

            if (!response.ok) {
                console.warn("⚠️ Erreur lors de la récupération du profil.");
                return;
            }

            const user = await response.json();
            document.getElementById("prenom").value = user.prenom || "";
            document.getElementById("nom").value = user.nom || "";
            document.getElementById("email").value = user.email || "";
        } catch (error) {
            console.error("❌ Erreur lors de la récupération du profil :", error);
        }
    }

    getUserInfo();
});
