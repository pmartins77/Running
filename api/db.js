const { Pool } = require("pg");
require("dotenv").config(); 

if (!process.env.DATABASE_URL) {
    console.error("❌ Erreur : La variable d'environnement DATABASE_URL est manquante !");
    process.exit(1);
}

// Configuration de PostgreSQL avec vérification du SSL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
});

// Vérification immédiate de la connexion
(async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Connexion à PostgreSQL réussie !");
        client.release();
    } catch (err) {
        console.error("❌ Erreur de connexion à PostgreSQL :", err);
        process.exit(1);
    }
})();

// Export du pool de connexion
module.exports = { pool };
