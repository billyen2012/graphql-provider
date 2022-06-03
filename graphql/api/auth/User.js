const { GraphqlProvider } = require("../../../graphql-provider"); // make sure this is where the lib exist
const User = require("../../../model/User");
const { UserInputError } = require("apollo-server");
const Article = require("../../../model/Article");
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
  type UpdateUser{
    code:String,
    message:String
  }
  enum AuthType {
    REGULAR
    ADMIN
  }
`
)
  .addCustomResolver("User", {
    Articles: async (parent, args, context) =>
      parent
        .getArticles()
        .then((articles) =>
          articles.filter(
            (article) =>
              article.visibility === "PUBLIC" ||
              article.userId === context.user.id
          )
        ),
  })
  // get user's basic info
  .get({
    name: "Me",
    description: "get self basic info",
    type: `User`,
    resolver: async (parent, args, context, info) => {
      // const { searchKeys } = gqlQueryKeyParser(context.req.body.query);
      // const include = [];
      // if (searchKeys.includes("Articles")) include.push(Article);
      return User.findByPk(context.user.id);
    },
  })
  .update({
    name: "Me",
    description: "update user info",
    params: {
      email: "String!",
    },
    type: "UpdateUser",
    beforeResolve: (parent, { email }, context, info) => {
      if (!validator.isEmail(email)) throw new UserInputError("invalid email");
    },
    resolver: async (parent, { email }, context, info) => {
      context.user.email = email;
      await context.user.save();

      return {
        code: 200,
        message: "password updated",
      };
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
