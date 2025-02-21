function uploadCSV() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner un fichier CSV.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const csvData = event.target.result;
        const jsonData = csvToJson(csvData);

        fetch("/api/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(jsonData),
        })
        .then(response => response.text())
        .then(() => {
            alert("✅ Fichier importé avec succès !");
            location.reload();
        })
        .catch(error => console.error("❌ Erreur lors de l'importation :", error));
    };

    reader.readAsText(file);
}

function csvToJson(csv) {
    const lines = csv.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    const headers = lines[0].split(",");
    const data = lines.slice(1).map(line => {
        const values = line.split(",");
        return {
            date: values[0].trim(),
            echauffement: values[1].trim(),
            type: values[2].trim(),
            duration: values[3].trim(),
            intensity: values[4].trim(),
            details: values[5].trim()
        };
    });

    return data;
}
