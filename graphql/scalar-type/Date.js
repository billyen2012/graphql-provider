const { GraphqlProvider } = require("../../graphql-provider");

// see https://www.apollographql.com/docs/apollo-server/schema/custom-scalars/  for details
GraphqlProvider.addScalarType({
  name: "Date",
  description: "Date custom scalar type",
  /**@param {Date} value */
  serialize(value) {
    return value.toISOString();
  },
  parseValue(value) {
    return new Date(parseInt(value));
  },
});
