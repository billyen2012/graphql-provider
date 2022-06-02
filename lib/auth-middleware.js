const { AuthenticationError, ApolloError } = require("apollo-server");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const User = require("../model/User");
const { customErrorCodes } = require("./error");

const verifyUser = async (parent, args, context, info) => {
  const { req } = context;

  if (!req.headers.authorization)
    throw new AuthenticationError("authorization header not exist");

  if (!req.headers.authorization.startsWith("Bearer "))
    throw new AuthenticationError(
      'invalid token format, please ensure "Bearer " in included'
    );
  const token = req.headers.authorization.split(" ")[1];
  // validate toke
  const payload = jwt.verify(token, JWT_SECRET);
  const user = await User.findByPk(payload.subject);
  // check if thr user do exist in the db
  if (!user) {
    throw new ApolloError(
      "User not exist (may already be deleted)",
      customErrorCodes.USER_NOT_EXIST
    );
  }
  // map user object to context.user if success
  context.user = user;
};

module.exports = {
  verifyUser,
};
