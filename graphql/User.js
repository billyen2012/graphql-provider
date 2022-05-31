const { GraphqlProvider } = require("../graphql-provider"); // make sure this is where the lib exist
const User = require("../model/User");
const jwt = require("jsonwebtoken");
const { UserInputError, ApolloError } = require("apollo-server");
const { customErrorCodes } = require("../lib/error");
const { verifyUser } = require("../lib/auth-middleware");
const { JWT_SECRET } = require("../config");
const Article = require("../model/Article");
const validator = require("validator").default;

User.hasMany(Article, { foreignKey: "userId" });

GraphqlProvider.addType(
  `
  type User{
    id: ID!,
    email:String,
    username:String,
    createdAt:Date,
    updatedAt:Date,
    Articles:[Article]
  }
  type CreateUser{
    code:String,
    message:String
    token:String
  }
  type UpdatePassword{
    code:String,
    message:String
  }
`
)

  .get({
    name: "User",
    params: {
      id: "ID!",
    },
    type: "User",
    resolver: async (parent, { id }, context, info) => {
      return User.findByPk(id, { include: Article }).then((e) =>
        e ? e.toJSON() : null
      );
    },
  })

  .get({
    name: "Users",
    type: `[User]`,
    resolver: async () => {
      return User.findAll().then((e) => e.map((model) => model.toJSON()));
    },
  })

  .post({
    name: "User",
    params: {
      username: "String!",
      password: "String!",
      email: "String",
    },
    type: "CreateUser",
    beforeResolve: async (
      parent,
      { username, password, email },
      context,
      info
    ) => {
      if (password.length < 8)
        throw new UserInputError("password required at least 8 characters");
      if (email && !validator.isEmail(email))
        throw new UserInputError("invalid email");
      if (await User.findOne({ where: { username } })) {
        throw new ApolloError(
          "User already exist",
          customErrorCodes.USER_ALREADY_EXIST
        );
      }
    },
    resolver: async (parent, { username, password, email }, context, info) => {
      return User.create({ username, password, email }).then((e) => ({
        code: 200,
        message: "user created",
        token: jwt.sign({ subject: e.id }, JWT_SECRET),
      }));
    },
  })
  .put({
    name: "Password",
    params: {
      password: "String!",
    },
    type: "UpdatePassword",
    beforeResolve: verifyUser((parent, { password }, context, info) => {
      if (password.length < 8)
        throw new UserInputError("password required at least 8 characters");
    }),
    resolver: async (parent, { password }, context, info) => {
      context.user.password = password;
      await context.user.save();

      return {
        code: 200,
        message: "password updated",
      };
    },
  });
