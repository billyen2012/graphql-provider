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

// this method args (QueryName, returnType, Resolver)
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
    resolver: async (parent, { id }, context, info) => {
      User.findByPk(id).then((e) => (e ? console.log(e.toJSON()) : null));
      return User.findByPk(id).then((e) => (e ? e.toJSON() : null));
    },
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
