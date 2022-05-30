const { GraphqlProvider } = require("../graphql-provider"); // make sure this is where the lib exist
const User = require("../model/User");
const jwt = require("jsonwebtoken");
const { JsonWebTokenError } = require("jsonwebtoken");
const { TokenExpiredError } = require("jsonwebtoken");
const {
  AuthenticationError,
  UserInputError,
  ApolloError,
} = require("apollo-server");

GraphqlProvider.addType({
  User: `
    id: ID!,
    email:String,
    username:String,
    createdAt:Float,
    updatedAt:Float
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

  .addQuery({
    name: "getUser",
    params: {
      id: "ID!",
    },
    type: "User",
    resolver: async (parent, { id }, context, info) => {
      User.findByPk(id).then((e) => (e ? console.log(e.toJSON()) : null));
      return User.findByPk(id).then((e) => (e ? e.toJSON() : null));
    },
  })

  .addQuery({
    name: "getUsers",
    type: `[User]`,
    resolver: async () => {
      return User.findAll().then((e) => e.map((model) => model.toJSON()));
    },
  })

  .addMutation({
    name: "postUser",
    params: {
      username: "String!",
      password: "String!",
      email: "String",
    },
    type: "CreateUser",
    resolver: async (parent, { username, password, email }, context, info) => {
      // if user already exist
      if (await User.findOne({ where: { username } }))
        return {
          code: 409,
          message: "username already taken",
          token: null,
        };

      return User.create({ username, password, email })
        .then((e) => ({
          code: 200,
          message: "user created",
          token: jwt.sign({ subject: e.id }, "the_secret"),
        }))
        .catch((err) => ({
          code: 500,
          message: "An error has occured while created new user",
          token: null,
        }));
    },
  })
  .addMutation({
    name: "putPassword",
    params: {
      password: "String!",
    },
    type: "UpdatePassword",
    beforeResolve: async (parent, { password }, context, info) => {
      const { req } = context;

      if (!req.headers.authorization)
        throw new AuthenticationError("authorization header not exist");

      // validate token
      const payload = jwt.verify(req.headers.authorization, "the_secret");
      const user = await User.findByPk(payload.subject);
      if (password.length < 8)
        throw new UserInputError("password required at least 8 characters");
      // return bad request if user not exist
      if (!user) throw new Error("User not exist");
      // map user object to context.user if success
      context.user = user;
    },
    onError: (err) => {
      if (err instanceof TokenExpiredError)
        throw new AuthenticationError("token expired");
      if (err instanceof JsonWebTokenError)
        throw new AuthenticationError("invalid token");
      if (err instanceof ApolloError) throw err;
      // throw generic error if the err instance can't be identify
      // the generic error will be automatically converted to the Interal_server_error of graphql
      throw new Error("An Error Has Occured");
    },
    resolver: async (parent, { password }, context, info) => {
      context.user.password = password;
      await context.user.save();

      return {
        code: 200,
        message: "password updated",
      };
    },
  });
