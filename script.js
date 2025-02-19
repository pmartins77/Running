document.getElementById('file-input').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            processCSV(content);
        };
        reader.readAsText(file);
    }
});

async function processCSV(csvText) {
    const lines = csvText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    const headers = lines[0].split(",");

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const trainingData = {
            date: values[0],
            echauffement: values[1],
            entrainement: values[2],
            recuperation: values[3],
            conseils: values[4]
        };

        await sendTrainingToDB(trainingData);
    }

    alert("Importation terminée !");
    location.reload(); // Recharge la page pour voir les données mises à jour
}

async function sendTrainingToDB(training) {
    try {
        const response = await fetch('/api/training', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(training)
        });

        const data = await response.json();
        console.log('Réponse du serveur:', data);
    } catch (error) {
        console.error('Erreur lors de l'envoi des données:', error);
    }
}