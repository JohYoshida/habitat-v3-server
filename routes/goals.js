// Database requirements
const dbconfig = require("./knexfile.js")[process.env.DB_ENV];
const knex = require("knex")(dbconfig);

// Get all goals
exports.getAll = (req, res) => {
  knex("goals")
    .orderBy("type")
    .then(goals => {
      res.send({msg: "Get goals", goals});
    })
    .catch(err => {
      res.send({msg: "Failed to get goals."});
      console.log("Error!", err);
    });
};

// Add or update a goal
exports.post = (req, res) => {
  const {exercise_id, type, value} = req.body;
  knex("goals")
    .first()
    .where({exercise_id, type})
    .then(goal => {
      // Update goal
      knex("goals")
        .first()
        .where({id: goal.id})
        .update({value})
        .then(() => {
          goal.value = value; // so the return object reflects the update
          console.log("Updated goal");
          res.send({msg: "Updated goal", goal});
        })
        .catch(err => {
          console.log("Couldn't update goal. Check request body", err);
          res.send({msg: "Couldn't update goal", err});
        });
    })
    .catch(() => {
      // Add goal
      const id = uuid();
      const createdAt = moment().format();
      knex("goals")
        .insert({id, exercise_id, type, value, createdAt})
        .then(() => {
          console.log("Added goal");
          res.send({msg: "Added goal"});
        })
        .catch(err => {
          console.log("Couldn't add goal. Check request body", err);
          res.send({msg: "Couldn't add goal", err});
        });
    });
};

// TODO: Complete this route
exports.postAll = (req, res) => {};

// Delete a goal by id
exports.delete = (req, res) => {
  const {id} = req.params;
  knex("goals")
    .where({id})
    .del()
    .then(() => {
      res.send({msg: "Deleted goal", id});
    })
    .catch(err => {
      res.send({msg: "Error: could not delete goal", id, err});
    });
};
