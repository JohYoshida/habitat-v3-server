
exports.up = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("workouts"),
    knex.schema.createTable("workouts", table => {
      table.uuid("id").primary();
      table.uuid("exercise_id");
      table.integer("reps");
      table.integer("sets");
      table.integer("seconds");
      table.string("createdAt");
    }),
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("workouts"),
  ]);
};
