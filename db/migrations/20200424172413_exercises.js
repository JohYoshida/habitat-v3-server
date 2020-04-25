
exports.up = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("exercises"),
    knex.schema.createTable("exercises", table => {
      table.uuid("id").primary();
      table.string("name");
    }),
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("exercises"),
  ]);
};
