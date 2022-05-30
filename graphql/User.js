const { GraphqlProvider } = require("../graphql-provider"); // make sure this is where the lib exist
const User = require("../model/User");
const jwt = require("jsonwebtoken");
const { UserInputError, ApolloError } = require("apollo-server");
const { errorHanlder, customErrorCodes } = require("../lib/error");
const { verifyUser } = require("../lib/auth-middleware");
const { JWT_SECRET } = require("../config");
const validator = require("validator").default;

GraphqlProvider.addType({
  User: `
    id: ID!,
    email:String,
    username:String,
    createdAt:Date,
    updatedAt:Date
  `,
  CreateUser: `
    code:String,
    message:String
    token:String
  `,
  UpdatePassword: `
    code:String,
    message:String
  `,
})

  .get({
    name: "User",
    params: {
      id: "ID!",
    },
    type: "User",
    resolver: async (parent, { id }, context, info) => {
      User.findByPk(id).then((e) => (e ? console.log(e.toJSON()) : null));
      return User.findByPk(id).then((e) => (e ? e.toJSON() : null));
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
    onError: errorHanlder,
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
    onError: errorHanlder,
    resolver: async (parent, { password }, context, info) => {
      context.user.password = password;
      await context.user.save();

      return {
        code: 200,
        message: "password updated",
      };
    },
  });
