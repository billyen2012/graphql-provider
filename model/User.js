const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../postgres-provider");

const User = sequelize.define("User", {
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});

User.beforeSave((model) => {
  model.password = bcrypt.hashSync(model.password, 10);
});

sequelize.sync();

module.exports = User;
