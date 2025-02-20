// /api/db.js (Connexion PostgreSQL)
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL manquante !");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(() => console.log("✅ Connexion PostgreSQL réussie !"))
    .catch(err => {
        console.error("❌ Erreur connexion PostgreSQL :", err);
        process.exit(1);
    });

module.exports = { pool };
