const {
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_USERNAME,
  DATABASE_PORT,
} = require("./config");
const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  `postgres://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`
);

module.exports = sequelize;
