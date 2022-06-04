const { DataTypes } = require("sequelize");
const sequelize = require("../postgres-provider");

const Article = sequelize.define("Article", {
  userId: DataTypes.INTEGER,
  visibility: {
    type: DataTypes.STRING,
    validate: {
      isIn: {
        args: [["PUBLIC", "PRIVATE"]],
        msg: "visibility can only be 1 (public) or 2 (private)",
      },
    },
  },
  subject: DataTypes.STRING,
  content: DataTypes.TEXT,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});

module.exports = Article;
