const express = require('express');
const cors = require('cors');
require('dotenv').config();
const getTrainings = require('./getTrainings');
const deleteAll = require('./deleteAll');
const upload = require('./upload');

const app = express();

app.use(cors());
app.use(express.json());

// Vérification que le serveur tourne bien
app.get('/', (req, res) => {
    res.send("✅ Serveur API en ligne !");
});

// Routes API (Assurez-vous que chaque module exporte un router Express)
app.use('/api/getTrainings', getTrainings);
app.use('/api/deleteAll', deleteAll);
app.use('/api/upload', upload);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur API démarré sur le port ${PORT}`));
