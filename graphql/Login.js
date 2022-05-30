const { GraphqlProvider } = require("../graphql-provider"); // make sure this is where the lib exist
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const { errorHanlder, customErrorCodes } = require("../lib/error");
const { UserInputError, ApolloError } = require("apollo-server");
const { JWT_SECRET } = require("../config");

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
    beforeResolve: (parent, { username, password }, context, info) => {
      if (!username) throw new UserInputError("username can not be empty");
      if (!password) throw new UserInputError("password can not be empty");
    },
    onError: errorHanlder,
    resolver: async (parent, { username, password }, context, info) =>
      User.findOne({ where: { username } }).then((e) => {
        // if user not found
        if (!e)
          throw new ApolloError(
            "invalid username/password combination",
            customErrorCodes.INVALID_USERNAME_PASSWORD_COMBINATION
          );
        // validate password
        const validatePassword = bcrypt.compareSync(password, e.password);
        if (!validatePassword)
          throw new ApolloError(
            "invalid username/password combination",
            customErrorCodes.INVALID_USERNAME_PASSWORD_COMBINATION
          );
        // if password pass
        return {
          code: 200,
          // change to your own secret
          message: jwt.sign({ subject: e.id }, JWT_SECRET),
        };
      }),
  });
