exports.up = function(knex) {
  return Promise.all([
    knex.schema.table("exercises", table => {
      table.integer("dailyGoal");
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table("exercises", table => {
      table.dropColumn("dailyGoal");
    })
  ]);
};
