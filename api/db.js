const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL est manquante !");
    process.exit(1);
}

// ✅ Configuration de la connexion PostgreSQL avec gestion avancée des erreurs
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // 🔥 Important pour éviter les erreurs TLS sur NeonDB
    connectionTimeoutMillis: 5000, // ✅ Timeout de connexion pour éviter les blocages
    idleTimeoutMillis: 30000, // ✅ Ferme les connexions inactives après 30s
    max: 10 // ✅ Limite à 10 connexions simultanées
});

pool.connect()
    .then(() => console.log("✅ Connexion PostgreSQL réussie !"))
    .catch(err => {
        console.error("❌ Erreur connexion PostgreSQL :", err);
        process.exit(1);
    });

module.exports = { pool };
