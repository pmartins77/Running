const { Pool } = require("pg");

// Vérification de l'URL de la base de données
if (!process.env.DATABASE_URL) {
    console.error("❌ Erreur : La variable d'environnement DATABASE_URL est manquante !");
    process.exit(1); // Arrêter le processus si l'URL est absente
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
});

// Vérification et reconnexion automatique en cas d'échec
pool.connect()
    .then(() => console.log("✅ Connexion à PostgreSQL réussie !"))
    .catch(err => {
        console.error("❌ Erreur de connexion à PostgreSQL :", err);
        process.exit(1); // Arrêter le serveur si la connexion échoue
    });

module.exports = { pool };
