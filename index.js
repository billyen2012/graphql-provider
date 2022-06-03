const { GraphqlProvider } = require("./graphql-provider"); // make sure this is where the lib exist
const { errorHanlder } = require("./lib/error");
const Article = require("./model/Article");
const User = require("./model/User");

const start = async () => {
  // syn database
  await User.sync();
  await Article.sync();
  // load graphql
  GraphqlProvider.load(process.cwd() + "/graphql"); // make sure this is where all the grapql files exist
  // server start
  GraphqlProvider.start().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};

// global event hook
GraphqlProvider.beforeResolve(() => {
  console.log("global before resolved called");
});

GraphqlProvider.afterResolve(() => {
  console.log("global after resolved called");
});

// if local onError is not defined, this will be called
// make sure err is only the subclass of Error object
// (better to just use ApolloError)
// and throw the error out eventually
GraphqlProvider.onError((err) => {
  errorHanlder(err);
});

start();
