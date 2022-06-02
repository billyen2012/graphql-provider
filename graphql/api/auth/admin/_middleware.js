const { AuthenticationError } = require("apollo-server");

module.exports = async (parent, args, context, info) => {
  // verify user type
  if (context.user.authType !== "ADMIN")
    throw new AuthenticationError("required admin level access");
};
