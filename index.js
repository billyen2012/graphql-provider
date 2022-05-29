const { ApolloServer } = require("apollo-server");
const jsonwebtoken = require("jsonwebtoken");
const { GraphqlProvider } = require("./graphql-provider"); // make sure this is where the lib exist
const User = require("./model/User");
GraphqlProvider.load(process.cwd() + "/graphql"); // make sure this is where all the grapql files exist

const server = new ApolloServer({
  typeDefs: GraphqlProvider.typeDefs,
  resolvers: GraphqlProvider.resolvers,
  csrfPrevention: true,
  context: ({ req }) => {
    return { req };
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
