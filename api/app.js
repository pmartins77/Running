const express = require('express');
const cors = require('cors');
require('dotenv').config();
const getTrainings = require('./getTrainings');
const deleteAll = require('./deleteAll');
const upload = require('./upload');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Test de connexion à PostgreSQL
app.get("/api/test-db", async (req, res) => {
    try {
        const client = await db.pool.connect();
        const result = await client.query("SELECT NOW()");
        client.release();
        res.json({ success: true, timestamp: result.rows[0].now });
    } catch (error) {
        console.error("❌ Erreur de connexion à PostgreSQL Patrick :", error);
        res.status(500).json({ error: "Erreur de connexion à PostgreSQL" });
    }
});

// Routes API
app.use('/api/getTrainings', getTrainings);
app.use('/api/deleteAll', deleteAll);
app.use('/api/upload', upload);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));
