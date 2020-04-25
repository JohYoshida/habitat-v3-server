// Server requirements
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { v1: uuid } = require('uuid');
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

app.get("/exercises", (req, res) => {
  // Get exercises
  knex("exercises")
    .then(exercises => {
      res.send({ msg: "Get exercises", data: exercises });
    })
    .catch(err => {
      res.send({ msg: "Failed to get exercises."});
      console.log("Error!", err);
    });
});

app.post("/exercise", (req, res) => {
  const { name } = req.body;
  // Check for existing exercise
  knex("exercises")
    .where({ name })
    .then(exercise => {
      if (exercise) {
        res.send({ msg: "An exercise with that name already exists"});
      } else {
        // Add to database
        const id = uuid()
        knex("exercises")
          .insert({ id, name })
          .then(() => {
            res.send({ msg: "Registered exercise", name, id });
          })
          .catch(err => {
            res.send({ msg: "Failed to register exercise."});
            console.log("Error!", err);
          });
      }
    })
    // TODO: verify what this catch does
    .catch(err => {
      res.send({ msg: "Failed duplicate exercise check."});
      console.log("Error!", err);
    });
});

app.delete("/exercise", (req, res) => {
  const { id, name } = req.body;
  knex("exercises")
    .where({ id })
    .then(() => {
      res.send({ msg: "Deleted exercise", name, id });
    })
    .catch(err => {
      res.send({ msg: "Failed to delete exercise."});
      console.log("Error!", err);
    });
});

app.get("/workouts", (req, res) => {
  const { id, exercise_id, reps, sets } = req.body;
  // Get workouts
  knex("workouts")
  .where({ exercise_id })
    .then(workouts => {
      res.send({ msg: "Get workouts", data: workouts });
    })
    .catch(err => {
      res.send({ msg: "Failed to get workouts."});
      console.log("Error!", err);
    });
});

app.post("/workout", (req, res) => {
  const { exercise_id, reps, sets } = req.body;
  const id = uuid();
  knex("workout")
    .insert({ id, exercise_id, reps, sets})
    .then(() => {
      res.send({ msg: "Registered workout", id });
    })
    .catch(err => {
      res.send({ msg: "Failed to register workout."});
      console.log("Error!", err);
    });
});

// Start server
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
