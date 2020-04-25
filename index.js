// Server requirements
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const moment = require("moment");
const uuid = require("uuid/v1");
const PORT = process.env.PORT || 4000;
const app = express();

// Database requirements
const dbconfig = require("./knexfile.js")[process.env.DB_ENV];
const knex = require("knex")(dbconfig);

// parse application/json
app.use(bodyParser.json());

// Home
app.get("/", (req, res) => {
  res.send("Habitat server");
});


// Start server
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
