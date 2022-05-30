# Dependencies

    "apollo-server": "^3.8.1" or up
    "graphql": "^16.5.0" or up

# Basic setup

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
    User: `
      id: ID!,
      email:String,
      username:String,
      createdAt:Float,
      updatedAt:Float
    `,
    CreateUser: `
      code:String,
      message:String
      token:String
    `,
    UpdatePassword: `
      code:String,
      message:String
    `,
);

GraphqlProvider.addQuery({
    name: "getUser",
    params: {
      id: "ID!",
    },
    type: "User",
    beforeResolve:(parent, { id }, context, info)=>{
      const token = context.req.headers.authorization
      // ....then your middleware logic go here
    }
    onError(err){
      // this will be called before err get passed to apollo server's error handler
      // will be handy for throwing custom error or do some error checking
    },
    resolver: async (parent, { id }, context, info) => {
      User.findByPk(id).then((e) => (e ? console.log(e.toJSON()) : null));
      return User.findByPk(id).then((e) => (e ? e.toJSON() : null));
    },
// add your mutation, it will take the object with same property shown above
}).addMutation({
  ...
})

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
  // context hook of apollo-server(
  // suggest to setup as it is below to just pass the req to context and then use beforeResolve() hook as middleware for each resolver)
  context: ({ req }) => {
    return { req };
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
```

# Add Scalar Type

```js
const { GraphqlProvider } = require("../graphql-provider");
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
```

# Standardizing 'name'

Since graphql is just a single point of api, it is not like REST api that uses GET, POST, DELETE,...etc, request name to tell user what the api is going to do to the data. Therefore, it is better to have a more Standardized way naming the 'name' for the Query and Mutation to make the api more intuitive by its name.

To have a more REST api experiences, uses the following method to add new Query and Mutation

below show the 4 methods provided by the provider and it will add a prefix to the 'name' and add it to Mutation or Query based on its api type.

```js
// this will add `getUser` to Query (get resources)
GraphqlProvider.add({
  name: "User",
});
// this will add `postUser` to Mutation (create resources)
GraphqlProvider.post({
  name: "User",
});
// this will add `putUser` to Mutation (update resources)
GraphqlProvider.put({
  name: "User",
});
// this will add `deleteUser` to Mutation (delete resources)
GraphqlProvider.delete({
  name: "User",
});
```
