// 📂 1️⃣ Fonction d'importation du fichier CSV
async function uploadCSV() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        alert("Vous devez être connecté pour importer un fichier CSV.");
        return;
    }

    const fileInput = document.getElementById("csvFileInput");
    if (!fileInput.files.length) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (event) {
        const csvData = event.target.result;
        const parsedData = parseCSV(csvData);

        if (!parsedData.length) {
            alert("Le fichier CSV est vide ou mal formaté.");
            return;
        }

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(parsedData)
            });

            const result = await response.json();
            if (response.ok) {
                alert("✅ Importation réussie !");
                loadCalendar(); // Rafraîchir le calendrier après l'import
            } else {
                alert("❌ Erreur lors de l'importation : " + result.error);
            }
        } catch (error) {
            console.error("❌ Erreur d'importation :", error);
            alert("Une erreur est survenue lors de l'importation.");
        }
    };

    reader.readAsText(file);
}

// 📂 2️⃣ Fonction pour parser le fichier CSV en JSON
function parseCSV(csvText) {
    const rows = csvText.split("\n").map(row => row.trim()).filter(row => row);
    const headers = rows.shift().split(",");

    return rows.map(row => {
        const values = row.split(",");
        let entry = {};
        headers.forEach((header, index) => {
            entry[header.trim()] = values[index] ? values[index].trim() : "";
        });
        return entry;
    });
}
