fetch("/api/test-env")
    .then(response => response.json())
    .then(data => {
        document.getElementById("envVar").textContent = data.DATABASE_URL || "Variable non trouvée";
    })
    .catch(error => {
        console.error("Erreur de récupération :", error);
        document.getElementById("envVar").textContent = "Erreur lors de la récupération de la variable.";
    });
