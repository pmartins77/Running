document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    async function getUserInfo() {
        try {
            const response = await fetch("/api/auth/user", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                console.warn("⚠️ Erreur lors de la récupération du profil.");
                return;
            }

            const user = await response.json();
            document.getElementById("prenom").value = user.prenom || "";
            document.getElementById("nom").value = user.nom || "";
            document.getElementById("email").value = user.email || "";
            document.getElementById("tel").value = user.tel || "";
            document.getElementById("date_naissance").value = user.date_naissance || "";
            document.getElementById("objectif").value = user.objectif || "";
            document.getElementById("date_objectif").value = user.date_objectif || "";
        } catch (error) {
            console.error("❌ Erreur lors de la récupération du profil :", error);
        }
    }

    getUserInfo();
});
