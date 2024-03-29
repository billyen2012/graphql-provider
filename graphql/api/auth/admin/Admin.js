const { GraphqlProvider } = require("../../../../graphql-provider"); // make sure this is where the lib exist
const User = require("../../../../model/User");
const jwt = require("jsonwebtoken");
const { UserInputError, ApolloError } = require("apollo-server");
const { customErrorCodes } = require("../../../../lib/error");
const { JWT_SECRET } = require("../../../../config");

const validator = require("validator").default;

GraphqlProvider
  // get user by id
  .get({
    name: "UserAdmin",
    description: "get a user's info by id",
    params: {
      id: "ID!",
    },
    type: "User",
    resolver: async (parent, { id }, context, info) => {
      return User.findByPk(id);
    },
  })
  // get all users info
  .get({
    name: "UsersAdmin",
    description: "get all users info",
    type: `[User]`,
    resolver: async () => {
      return User.findAll();
    },
  })
  // create a user
  .create({
    name: "UserAdmin",
    description: "create a user by an admin account",
    params: {
      username: "String!",
      password: "String!",
      email: "String",
      authType: "AuthType!",
    },
    type: "CreateUser",
    beforeResolve: async (
      parent,
      { username, password, email, authType },
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

  .update({
    name: "UserPasswordAdmin",
    description: "update an user's password",
    params: {
      id: "ID!",
      password: "String!",
    },
    type: "UpdatePassword",
    beforeResolve: (parent, { password }, context, info) => {
      if (password.length < 8)
        throw new UserInputError("password required at least 8 characters");
    },
    resolver: async (parent, { id, password }, context, info) => {
      const user = await User.findByPk(id);
      if (!user)
        throw new ApolloError(
          "User Id Not Found",
          customErrorCodes.USER_NOT_EXIST
        );

      user.password = password;
      await user.save();

      return {
        code: 200,
        message: "password updated",
      };
    },
  });
