const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/upload', require('./upload'));
app.use('/api/getTrainings', require('./getTrainings'));
app.use('/api/deleteAll', require('./deleteAll'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur API démarré sur le port ${PORT}`));
