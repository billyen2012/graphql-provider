const { GraphqlProvider } = require("../../../graphql-provider"); // make sure this is where the lib exist
const User = require("../../../model/User");
const jwt = require("jsonwebtoken");
const {
  UserInputError,
  ApolloError,
  AuthenticationError,
} = require("apollo-server");
const { customErrorCodes } = require("../../../lib/error");
const { JWT_SECRET } = require("../../../config");
const Article = require("../../../model/Article");
const { gqlQueryKeyParser } = require("../../../lib/gql-querykey-parser");
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
  enum AuthType {
    REGULAR
    ADMIN
  }
`
)
  // get user's basic info
  .get({
    name: "Me",
    description: "get self basic info",
    type: `User`,
    resolver: async (parent, args, context, info) => {
      const { searchKeys } = gqlQueryKeyParser(context.req.body.query);
      const include = [];
      if (searchKeys.includes("Articles")) include.push(Article);
      return User.findByPk(context.user.id, { include }).then((e) =>
        e.toJSON()
      );
    },
  })
  // update password
  .update({
    name: "Password",
    description: "update user's self password",
    params: {
      password: "String!",
    },
    type: "UpdatePassword",
    beforeResolve: (parent, { password }, context, info) => {
      if (password.length < 8)
        throw new UserInputError("password required at least 8 characters");
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
