const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  "postgres://postgres:secret@localhost:5432/dev"
);

module.exports = sequelize;
