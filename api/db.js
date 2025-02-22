const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL est manquante !");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // ⚠️ Important pour NeonDB
});

pool.on("connect", () => {
    console.log("✅ Connexion PostgreSQL établie !");
});

pool.on("error", (err) => {
    console.error("❌ Erreur avec la base PostgreSQL :", err);
});

module.exports = pool; // ✅ On exporte directement `pool` sans accolades
