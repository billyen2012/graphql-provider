const { GraphqlProvider } = require("../graphql-provider"); // make sure this is where the lib exist
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");

GraphqlProvider.addType({
  Auth: `
    code:Int,
    message:String,
  `,
})

  // this method args (QueryName, returnType, Resolver)
  .addQuery({
    name: "login",
    params: {
      username: "String!",
      password: "String!",
    },
    type: "Auth",
    resolver: async (parent, { username, password }, context, info) =>
      User.findOne({ where: { username } }).then((e) => {
        // if user not found
        if (!e)
          return {
            code: 400,
            message: "invalid username/password combination",
          };
        // validate password
        const validatePassword = bcrypt.compareSync(password, e.password);
        if (!validatePassword)
          return {
            code: 400,
            message: "invalid username/password combination",
          };
        // if password pass
        return {
          code: 200,
          // change to your own secret
          message: jwt.sign({ subject: e.id }, "the_secret"),
        };
      }),
  });
