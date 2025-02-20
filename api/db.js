const { Pool } = require("pg");
require("dotenv").config();  // Charger les variables d'environnement

if (!process.env.DATABASE_URL) {
    console.error();
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // Activation du SSL pour NeonDB
});

// Vérification immédiate de la connexion
pool.connect()
    .then(() => console.log("✅ Connexion à PostgreSQL réussie !"))
    .catch(err => {
        console.error("❌ Erreur de connexion à PostgreSQL :", err);
        process.exit(1); // Arrêter le serveur si la connexion échoue
    });

module.exports = { pool };
