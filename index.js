// Server requirements
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { v1: uuid } = require("uuid");
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

// Send all exercises
app.get("/exercises", (req, res) => {
  // Get exercises
  knex("exercises")
    .then(exercises => {
      res.send({ msg: "Get exercises", data: exercises });
    })
    .catch(err => {
      res.send({ msg: "Failed to get exercises." });
      console.log("Error!", err);
    });
});

// Add an exercise to database
app.post("/exercise", (req, res) => {
  const { name, mode } = req.body;
  // Check for existing exercise
  knex("exercises")
    .first()
    .where({ name })
    .then(exercise => {
      if (exercise) {
        res.send({
          msg: "An exercise with that name already exists",
          exercise
        });
      } else {
        // Add to database
        const id = uuid();
        knex("exercises")
          .insert({ id, name, mode, lifetimeTotal: 0 })
          .then(() => {
            res.send({ msg: "Registered exercise", name, id });
          })
          .catch(err => {
            res.send({ msg: "Failed to register exercise." });
            console.log("Error!", err);
          });
      }
    })
    // TODO: verify what this catch does
    .catch(err => {
      res.send({ msg: "Failed duplicate exercise check." });
      console.log("Error!", err);
    });
});

// Delete an exercise by id
app.delete("/exercise", (req, res) => {
  const { id, name } = req.body;
  knex("exercises")
    .where({ id })
    .del()
    .then(() => {
      knex("workouts")
        .where({ exercise_id: id })
        .del()
        .then(() => {
          res.send({
            msg: "Deleted exercise and associated workouts",
            name,
            id
          });
        })
        .catch(err => {
          res.send({
            msg: "Failed to delete workouts associated with exercise."
          });
          console.log("Error!", err);
        });
    })
    .catch(err => {
      res.send({ msg: "Failed to delete exercise." });
      console.log("Error!", err);
    });
});

// Get all workouts associated with an exercise by exercise_id
app.get("/workouts/:exercise_id", (req, res) => {
  const { exercise_id } = req.params;
  // Get workouts
  knex("workouts")
    .where({ exercise_id })
    .then(workouts => {
      res.send({ msg: "Get workouts", data: workouts });
    })
    .catch(err => {
      res.send({ msg: "Failed to get workouts." });
      console.log("Error!", err);
    });
});

// Add an exercise to database
app.post("/workout", (req, res) => {
  const { exercise_id, reps, sets, seconds } = req.body;
  const id = uuid();
  const createdAt = moment().format();
  knex("workouts")
    .insert({ id, exercise_id, reps, sets, seconds, createdAt })
    .then(() => {
      res.send({ msg: "Registered workout", id });
    })
    .catch(err => {
      res.send({ msg: "Failed to register workout." });
      console.log("Error!", err);
    });
});

// Delete an exercise by id
app.delete("/workout", (req, res) => {
  const { id } = req.body;
  knex("workouts")
    .where({ id })
    .del()
    .then(() => {
      res.send({ msg: "Deleted workout", id });
    })
    .catch(err => {
      res.send({ msg: "Failed to delete exercise." });
      console.log("Error!", err);
    });
})

// Start server
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
