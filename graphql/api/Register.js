const { GraphqlProvider } = require("../../graphql-provider");
const User = require("../../model/User");
const validator = require("validator").default;
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../config");
const { ApolloError, UserInputError } = require("apollo-server");
const { customErrorCodes } = require("../../lib/error");

GraphqlProvider.addMutation({
  name: "register",
  type: "CreateUser",
  params: {
    username: "String!",
    password: "String!",
    email: "String",
  },
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
        "username already exist",
        customErrorCodes.USER_ALREADY_EXIST
      );
    }
  },
  resolver: async (parent, { username, password, email }, context, info) => {
    return User.create({ username, password, email, authType: "REGULAR" }).then(
      (e) => ({
        code: 200,
        message: "user created",
        token: jwt.sign({ subject: e.id }, JWT_SECRET),
      })
    );
  },
});
