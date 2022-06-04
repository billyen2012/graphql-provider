const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../postgres-provider");

const User = sequelize.define("User", {
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  authType: {
    type: DataTypes.STRING,
    validate: {
      isIn: {
        args: [["REGULAR", "ADMIN"]],
        msg: "User type can only be REGULAR or ADMIN",
      },
    },
  },
  password: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});

User.beforeSave((model) => {
  model.password = bcrypt.hashSync(model.password, 10);
});

module.exports = User;
