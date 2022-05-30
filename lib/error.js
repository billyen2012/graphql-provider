const {
  AuthenticationError,
  UserInputError,
  ApolloError,
} = require("apollo-server");
const { TokenExpiredError, JsonWebTokenError } = require("jsonwebtoken");

const errorHanlder = (err) => {
  if (err instanceof TokenExpiredError)
    throw new AuthenticationError("token expired");
  if (err instanceof JsonWebTokenError)
    throw new AuthenticationError("invalid token");
  if (err instanceof ApolloError) throw err;
  // throw generic error if the err instance can't be identify
  // the generic error will be automatically converted to the Interal_server_error of graphql
  throw new Error("An unknown error has occured");
};

const customErrorCodes = {
  USER_ALREADY_EXIST: 5000,
  USER_NOT_EXIST: 5001,
};

module.exports = {
  errorHanlder,
  customErrorCodes,
};
