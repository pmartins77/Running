const { Pool } = require("pg");
require("dotenv").config();  // Charger les variables d'environnement

// Vérification de la variable DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error("❌ Erreur : La variable d'environnement DATABASE_URL est absente !");
    process.exit(1);
}

// Création du pool PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // Activer SSL pour NeonDB
});

// Vérifier immédiatement la connexion
pool.connect()
    .then(client => {
        console.log("✅ Connexion à PostgreSQL réussie !");
        client.release();
    })
    .catch(err => {
        console.error("❌ Échec de connexion à PostgreSQL :", err);
        process.exit(1);
    });

module.exports = { pool };
