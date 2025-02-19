import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Variable d'environnement pour la connexion
  ssl: {
    rejectUnauthorized: false, // Utilisé pour éviter les erreurs de certification SSL
  },
});

export default pool;
