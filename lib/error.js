const { AuthenticationError, ApolloError } = require("apollo-server");
const { TokenExpiredError, JsonWebTokenError } = require("jsonwebtoken");

const errorHanlder = (err) => {
  if (err instanceof TokenExpiredError)
    throw new AuthenticationError("token expired");
  if (err instanceof JsonWebTokenError)
    throw new AuthenticationError("invalid token");
  if (err instanceof ApolloError) throw err;

  console.log(err);
  // throw generic error if the err instance can't be identify
  // the generic error will be automatically converted to the Interal_server_error of graphql
  throw new Error("An unknown error has occured");
};

const customErrorCodes = {
  USER_ALREADY_EXIST: "USER_ALREADY_EXIST",
  USER_NOT_EXIST: "USER_NOT_EXIST",
  NOT_FOUND: "NOT_FOUND",
  INVALID_USERNAME_PASSWORD_COMBINATION:
    "INVALID_USERNAME_PASSWORD_COMBINATION",
};

module.exports = {
  errorHanlder,
  customErrorCodes,
};
