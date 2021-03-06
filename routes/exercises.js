// Requirements
const {v1: uuid} = require("uuid");
const dbconfig = require("../knexfile.js")[process.env.DB_ENV];
const knex = require("knex")(dbconfig);

// Get all exercises
exports.getAll = (req, res) => {
  knex("exercises")
    .orderBy("name")
    .then(exercises => {
      res.send({msg: "Get exercises", data: exercises});
    })
    .catch(err => {
      res.send({msg: "Failed to get exercises."});
      console.log("Error!", err);
    });
};

// Get exercise by id
exports.getByID = (req, res) => {
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
};

// Post an exercise
exports.post = (req, res) => {
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
};

// Update an exercise
exports.update = (req, res) => {
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
};

// Post a list of exercises
exports.postAll = (req, res) => {
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
};

// Delete by id
exports.delete = (req, res) => {
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
};

// TODO: delete method once fully depreciated by getGoalData
// Get daily goal data: daily goals and their associated exercise and workouts
exports.getDailyGoalData = (req, res) => {
  const {from, to} = req.params;
  const data = [];
  getDailyGoals()
    .then(goals => {
      let promises = [];
      console.log(from, to);
      goals.forEach(goal => {
        promises.push(getGraphData(goal.exercise_id, from, to));
      });
      Promise.all(promises).then(results => {
        goals.forEach((goal, index) => {
          const {exercise, total} = results[index];
          data.push({name: exercise.name, exercise, goal: goal.value, total});
        });
        res.send({msg: "Daily goal data", data});
      });
    })
    .catch(err => {
      res.send({msg: "Error", data: err});
    });
};

// TODO: delete method once fully depreciated by getGoalsRange
const getDailyGoals = () => {
  return new Promise((resolve, reject) => {
    knex("goals")
      .where({type: "daily"})
      .then(goals => resolve(goals))
      .catch(err => reject(err));
  });
};

// Get daily goal data: daily goals and their associated exercise and workouts
exports.getGoalData = (req, res) => {
  const {type, from, to} = req.params;
  const data = [];
  getGoalsRange(type)
    .then(goals => {
      let promises = [];
      goals.forEach(goal => {
        promises.push(getGraphData(goal.exercise_id, from, to));
      });
      Promise.all(promises).then(results => {
        goals.forEach((goal, index) => {
          const {exercise, total} = results[index];
          data.push({name: exercise.name, exercise, goal: goal.value, total});
        });
        res.send({msg: `${type} goal data`, data});
      });
    })
    .catch(err => {
      res.send({msg: "Error", data: err});
    });
};

const getGoalsRange = type => {
  return new Promise((resolve, reject) => {
    knex("goals")
      .where({type})
      .orderBy("exercise_name")
      .then(goals => resolve(goals))
      .catch(err => reject(err));
  });
};

const getGraphData = (exercise_id, from, to) => {
  return new Promise((resolve, reject) => {
    knex("exercises")
      .first()
      .where({id: exercise_id})
      .then(exercise => {
        knex("workouts")
          .where({exercise_id})
          .whereBetween("createdAt", [from, to])
          .then(workouts => {
            let total = 0;
            workouts.forEach(workout => {
              if (workout.seconds) {
                total += workout.seconds;
              } else {
                total += workout.reps * workout.sets;
              }
            });
            resolve({exercise, total});
          })
          .catch(() => reject());
      })
      .catch(err => reject(err));
  });
};
