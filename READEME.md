## Step 1
create a folder for store all the files for the `GraphqlProvider`
 - can be any name, but it will be using `graphql` as the folder name for the example
```
_
 \graphql
index.js
```
## Step 2
create a file under the graphql folder (this folder)
we will use `User.js` as example

```
_
 \graphql
    -User.js
index.js
```

## Step 3

add following to the User.js

```js
const { GraphqlProvider } = require("path/to/graphql-provider"); // make sure this is where the lib exist

const typeName = "User";

GraphqlProvider.addType(
  typeName,
  `
   email:String,
   name:String,
`
);

// this method args (QueryName, returnType, Resolver)
GraphqlProvider.addQuery("user", typeName, () => {
  return {
    email: "John Doe@example.com",
    name: "John Doe",
  };
});

```

## Step 4

in index.js, add the following

```js
const { ApolloServer, gql } = require("apollo-server");
const { GraphqlProvider } = require("path/to/graphql-provider"); // make sure this is where the lib exist

GraphqlProvider.load(process.cwd() + "/graphql"); // make sure this is where all the grapql files exist

const server = new ApolloServer({
  typeDefs: GraphqlProvider.typeDefs,
  resolvers: GraphqlProvider.resolvers,
  csrfPrevention: true,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

```
