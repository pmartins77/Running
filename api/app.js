const express = require("express");
const cors = require("cors");
require("dotenv").config();
const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");
const authRoutes = require("./auth");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Routes API
app.use("/api/auth", authRoutes);
app.use("/api/getTrainings", getTrainings);
app.use("/api/deleteAll", deleteAll);
app.use("/api/upload", upload);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur API démarré sur le port ${PORT}`));

module.exports = app;
