exports.up = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("goals"),
    knex.schema.createTable("goals", table => {
      table.uuid("id").primary();
      table.uuid("exercise_id");
      table.string("type"); // daily, weekly, monthly, yearly
      table.integer("value");
      table.string("createdAt");
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([knex.schema.dropTableIfExists("goals")]);
};
