const { GraphqlProvider } = require("../graphql-provider");

GraphqlProvider.addScalarType({
  name: "Date",
  description: "Date custom scalar type",
  /**@param {Date} value */
  serialize(value) {
    return value.toISOString(); // Convert outgoing Date to integer for JSON
  },
  parseValue(value) {
    return new Date(parseInt(value)); // Convert incoming integer to Date
  },
});
