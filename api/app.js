const express = require("express");
const cors = require("cors");

const getTrainings = require("./getTrainings");
const deleteAll = require("./deleteAll");
const upload = require("./upload");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/getTrainings", getTrainings);
app.use("/api/deleteAll", deleteAll);
app.use("/api/upload", upload);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur API démarré sur le port ${PORT}`);
});
