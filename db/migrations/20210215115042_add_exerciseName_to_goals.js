exports.up = function(knex) {
  return Promise.all([
    knex.schema.table("goals", table => {
      table.string("exercise_name");
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table("goals", table => {
      table.dropColumn("exercise_name");
    })
  ]);
};
