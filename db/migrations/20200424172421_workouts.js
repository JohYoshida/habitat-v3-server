
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists("workouts"),
    knex.schema.createTable("workouts", table => {
      table.uuid("id").primary();
      table.uuid("exercise_id");
      table.integer("reps");
      table.integer("sets");
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTableIfExists("workouts"),
  ]);
};
