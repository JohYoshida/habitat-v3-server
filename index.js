// Server requirements
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const moment = require("moment");
const {v1: uuid} = require("uuid");
const PORT = process.env.PORT || 4000;
const app = express();

// Database requirements
const dbconfig = require("./knexfile.js")[process.env.DB_ENV];
const knex = require("knex")(dbconfig);

// Route requirements
var exercises = require("./routes/exercises");
var workouts = require("./routes/workouts");
var goals = require("./routes/goals");

// parse application/json
app.use(bodyParser.json());

// Home
app.get("/", (req, res) => {
  res.send("Habitat server");
});

// Get all exercises
app.get("/exercises", (req, res) => {
  // Get exercises
  knex("exercises")
    .orderBy("name")
    .then(exercises => {
      res.send({msg: "Get exercises", data: exercises});
    })
    .catch(err => {
      res.send({msg: "Failed to get exercises."});
      console.log("Error!", err);
    });
});

// Get a particular exercise by id
app.get("/exercise/:id", (req, res) => {
  const {id} = req.params;
  // Get exercises
  knex("exercises")
    .first()
    .where({id})
    .then(exercise => {
      res.send({msg: "Get exercise", data: exercise});
    })
    .catch(err => {
      res.send({msg: "Failed to get exercise.", id});
      console.log("Error!", err);
    });
});

// Add an exercise to database
app.post("/exercise", (req, res) => {
  const {name, mode, dailyGoal} = req.body;
  // Check for existing exercise
  knex("exercises")
    .first()
    .where({name})
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
          .insert({id, name, mode, dailyGoal, lifetimeTotal: 0})
          .then(() => {
            res.send({msg: "Registered exercise", name, id});
          })
          .catch(err => {
            res.send({msg: "Failed to register exercise."});
            console.log("Error!", err);
          });
      }
    })
    // TODO: verify what this catch does
    .catch(err => {
      res.send({msg: "Failed duplicate exercise check."});
      console.log("Error!", err);
    });
});

// Update an exercise by id
app.post("/exercise/:id", (req, res) => {
  const {id} = req.params;
  const {name, mode, dailyGoal, lifetimeTotal} = req.body;
  knex("exercises")
    .first()
    .where({id})
    .update({name, mode, dailyGoal, lifetimeTotal})
    .then(() => {
      res.send({msg: "Updated exercise", name, id});
    })
    .catch(err => {
      res.send({msg: "Failed to update exercise."});
      console.log("Error!", err);
    });
});

// Add a list of exercises to database
app.post("/exercises", (req, res) => {
  const {list} = req.body;
  list.forEach(exercise => {
    let {id, name, mode, dailyGoal, lifetimeTotal} = exercise;
    knex("exercises")
      .insert({id, name, mode, dailyGoal, lifetimeTotal})
      .then(() => {
        console.log({msg: "Registered exercise", name, id});
      })
      .catch(err => {
        console.log("Error! Failed to register exercise.", err);
      });
  });
  res.send({msg: "Registered all exercises."});
});

// Delete an exercise by id
app.delete("/exercise", (req, res) => {
  const {id, name} = req.body;
  knex("exercises")
    .where({id})
    .del()
    .then(() => {
      knex("workouts")
        .where({exercise_id: id})
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
      res.send({msg: "Failed to delete exercise."});
      console.log("Error!", err);
    });
});

// Get all workouts associated with an exercise by exercise_id
app.get("/workouts/:exercise_id", (req, res) => {
  const {exercise_id} = req.params;
  // Get workouts
  knex("workouts")
    .where({exercise_id})
    .orderBy("createdAt", "asc")
    .then(workouts => {
      res.send({msg: "Get workouts", data: workouts});
    })
    .catch(err => {
      res.send({msg: "Failed to get workouts."});
      console.log("Error!", err);
    });
});

// Add a workout to database
app.post("/workout", (req, res) => {
  const {exercise_id, reps, sets, seconds} = req.body;
  const id = uuid();
  const createdAt = moment().format();
  knex("workouts")
    .insert({id, exercise_id, reps, sets, seconds, createdAt})
    .then(() => {
      knex("exercises")
        .first()
        .where({id: exercise_id})
        .then(exercise => {
          let amount;
          if (exercise.mode === "reps and sets") {
            amount = reps * sets;
          } else if (exercise.mode === "time") {
            amount = seconds;
          }
          knex("exercises")
            .first()
            .where({id: exercise_id})
            .update({
              lifetimeTotal: Number(exercise.lifetimeTotal) + amount
            })
            .then(() => {
              res.send({msg: "Registered workout", id});
            })
            .catch(err => {
              let msg =
                "Failed to update workout's associated exercise lifetimeTotal.";
              res.send({
                msg
              });
              console.log("Error!", msg, id, exercise_id, err);
            });
        })
        .catch(err => {
          let msg = "Failed to get exercise.";
          res.send({
            msg
          });
          console.log("Error!", msg, exercise_id, err);
        });
    })
    .catch(err => {
      let msg = "Failed to register workout.";
      res.send({msg});
      console.log("Error!", msg, id, err);
    });
});

// Add a list of workouts to database
app.post("/workouts", (req, res) => {
  const {list} = req.body;
  list.forEach(workout => {
    const {id, exercise_id, reps, sets, seconds, createdAt} = workout;
    knex("workouts")
      .insert({id, exercise_id, reps, sets, seconds, createdAt})
      .then(() => {
        console.log({msg: "Registered workout", id});
      })
      .catch(err => {
        console.log("Error! Failed to register workout.", err);
      });
  });
  res.send({msg: "Registered all workouts."});
});

// Delete a workout by id and decrease its associated exercise's lifetimeTotal
app.delete("/workout", (req, res) => {
  const {id, exercise_id, amount} = req.body;
  // Get the exercise for its current lifetimeTotal
  knex("exercises")
    .first()
    .where({id: exercise_id})
    .then(exercise => {
      // Set the new lifetimeTotal
      knex("exercises")
        .first()
        .where({id: exercise_id})
        .update({
          lifetimeTotal: exercise.lifetimeTotal - amount
        })
        .then(() => {
          // Delete the workout
          knex("workouts")
            .first()
            .where({id})
            .del()
            .then(() => {
              res.send({msg: "Deleted workout", id});
            })
            .catch(err => {
              let msg = "Failed to delete workout.";
              res.send({msg});
              console.log("Error!", msg, id, err);
            });
        })
        .catch(err => {
          let msg = "Failed to decrease exercise's lifetimeTotal.";
          res.send({msg});
          console.log("Error!", msg, exercise_id, err);
        });
    })
    .catch(err => {
      let msg = "Failed to retrieve exercise.";
      res.send({msg});
      console.log("Error!", msg, exercise_id, err);
    });
});

// Get all goals from the database
app.get("/goals", goals.getAll);

// Add or edit a goal
app.post("/goal", goals.post);

// TODO: Complete this route
// Add a list of goals to the database
app.post("/goals", goals.postAll);

// Delete a goal from the database by id
app.delete("/goal/:id", goals.delete);

// Get everything in the database for backup
app.get("/backup", (req, res) => {
  knex("exercises")
    .orderBy("name")
    .then(exercises => {
      knex("workouts")
        .orderBy("createdAt", "asc")
        .then(workouts => {
          knex("goals")
            .orderBy("type")
            .then(goals => {
              const time = moment();
              res.send({
                msg: "Backup: " + time,
                exercises,
                workouts
              });
            })
            .catch(err => {
              res.send({msg: "Failed to make backup when getting goals."});
              console.log("Error!", err);
            });
        })
        .catch(err => {
          res.send({msg: "Failed to make backup when getting workouts."});
          console.log("Error!", err);
        });
    })
    .catch(err => {
      res.send({msg: "Failed to make backup when getting exercises."});
      console.log("Error!", err);
    });
});

// TODO: Complete this method
app.post("/backup", (req, res) => {
  const {msg, exercises, workouts} = req.body;
  // Going to need a bunch of promises here to make this work
  res.send({msg: "This route isn't functional yet, check back later"});
});

// Start server
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
