// Requirements
const {v1: uuid} = require("uuid");
const dbconfig = require("../knexfile.js")[process.env.DB_ENV];
const knex = require("knex")(dbconfig);

// Get all workouts associated with an exercise
exports.getAll = (req, res) => {
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
};

// Post a workout
exports.post = (req, res) => {
  const {exercise_id, reps, sets, seconds, createdAt} = req.body;
  const id = uuid();
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
};

// Post a list of workouts
exports.postAll = (req, res) => {
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
};

// Delete workout by id and decrease its exercise's lifetimeTotal
exports.delete = (req, res) => {
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
};
