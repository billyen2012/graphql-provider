const { GraphqlProvider } = require("../graphql-provider"); // make sure this is where the lib exist
const User = require("../model/User");
const jwt = require("jsonwebtoken");

GraphqlProvider.addType({
  User: `
    id: ID!,
    email:String,
    username:String,
    created_at:String,
    updated_at:String
  `,
  CreateUser: `
    code:String,
    message:String
    token:String
  `,
})

  // this method args (QueryName, returnType, Resolver)
  .addQuery({
    name: "getUser",
    params: {
      id: "ID!",
    },
    type: "User",
    resolver: async (parent, { id }, context, info) => {
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
  });
