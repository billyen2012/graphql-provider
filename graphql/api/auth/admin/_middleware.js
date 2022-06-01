const { AuthenticationError } = require("apollo-server");
const { verifyUser } = require("../../../../lib/auth-middleware");

module.exports = async (parent, args, context, info) => {
  // verify user
  // await verifyUser(parent, args, context, info);
  // verify user type
  if (context.user.authType !== "ADMIN")
    throw new AuthenticationError("required admin level access");
};
