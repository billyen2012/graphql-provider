const { ApolloServer } = require("apollo-server");
const { GraphqlProvider } = require("./graphql-provider"); // make sure this is where the lib exist
const { errorHanlder } = require("./lib/error");

GraphqlProvider.load(process.cwd() + "/graphql"); // make sure this is where all the grapql files exist

const server = new ApolloServer({
  typeDefs: GraphqlProvider.typeDefs,
  resolvers: GraphqlProvider.resolvers,
  context: GraphqlProvider.context,
  csrfPrevention: true,
});

// GraphqlProvider.beforeResolve(() => {
//   console.log("global before resolved called");
// });

// GraphqlProvider.afterResolve(() => {
//   console.log("global after resolved called");
// });

// if local onError is not defined, this will be called
// make sure err is only the subclass of Error object
// (better to just use ApolloError)
// and throw the error out eventually
GraphqlProvider.onError((err) => {
  errorHanlder(err);
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
