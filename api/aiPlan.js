const tf = require('@tensorflow/tfjs-node');

async function generateAIPlan(userStats, objectif) {
    console.log("🚀 Génération d'un plan d'entraînement IA...");

    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, inputShape: [5], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
    
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    const inputData = tf.tensor2d([
        [userStats.total_km_12semaines, userStats.jours_semaine, objectif.distance, objectif.duree, objectif.denivele]
    ]);

    let output = model.predict(inputData);
    output = output.dataSync();

    return output.map((charge, semaine) => ({ semaine, charge: charge * 1.2 }));
}

module.exports = generateAIPlan;
