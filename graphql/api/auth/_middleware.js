const { verifyUser } = require("../../../lib/auth-middleware");

module.exports = async (parent, args, context, info) => {
  await verifyUser(parent, args, context, info);
};
