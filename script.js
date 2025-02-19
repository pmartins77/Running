document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const calendar = document.getElementById("calendar");
    const trainingDetails = document.getElementById("training-details");
    let trainingData = {};

    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const lines = e.target.result.split("\n").map(line => line.split(","));
            const headers = lines[0];
            lines.slice(1).forEach(row => {
                let entry = {};
                headers.forEach((header, index) => {
                    entry[header] = row[index];
                });
                trainingData[entry["Date"]] = entry;
            });
            renderCalendar();
        };
        reader.readAsText(file);
    });

    function renderCalendar() {
        calendar.innerHTML = "";
        for (let i = 1; i <= 30; i++) {
            let dayElement = document.createElement("div");
            dayElement.classList.add("day");
            dayElement.textContent = i;
            dayElement.addEventListener("click", function () {
                displayTraining(i);
            });
            calendar.appendChild(dayElement);
        }
    }

    function displayTraining(day) {
        let date = day.toString().padStart(2, '0') + "/02/2025";
        if (trainingData[date]) {
            trainingDetails.innerHTML = `
                <h2>Programme du ${date}</h2>
                <p><strong>Type:</strong> ${trainingData[date]["Type d'entraînement"]}</p>
                <p><strong>Échauffement:</strong> ${trainingData[date]["Échauffement"]}</p>
                <p><strong>Entraînement:</strong> ${trainingData[date]["Entraînement"]}</p>
                <p><strong>Récupération:</strong> ${trainingData[date]["Récupération"]}</p>
            `;
        } else {
            trainingDetails.innerHTML = `<h2>Programme du ${date}</h2><p>Aucune séance prévue.</p>`;
        }
    }
});
