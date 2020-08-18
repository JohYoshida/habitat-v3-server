exports.up = function(knex) {
  knex.schema.table("exercises", table => {
    table.integer("dailyGoal");
  });
};

exports.down = function(knex) {
  knex.schema.table("exercises", table => {
    table.dropColumn("dailyGoal");
  });
};
