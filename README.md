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

GraphqlProvider.addType(
  `
  type Article {
    id:ID!,
    subject:String,
    content:String,
    User:User
  }

  type User{
    id: ID!,
    email:String,
    username:String,
    createdAt:Date,
    updatedAt:Date,
    Articles:[Article]
  }

  enum AuthType {
    REGULAR
    ADMIN
  } message:String
`,
);

GraphqlProvider
   // When "User" type's "Articles" filed is requested, this resolver will be called to resolve the Articles
   // this is using sequalize as example
  .addCustomResolver("User", {
    Articles: async (parent, args, context, info) =>parent.getArticles()
  })
 .addQuery({
    name: "getUser",
    params: {
      id: "ID!",  // for here==
    },                   //  ||
    type: "User",        //  \/
    beforeResolve:(parent, { id }, context, info)=>{
      const token = context.req.headers.authorization
      // ....then your middleware logic go here
    }
    resolver: async (parent, { id }, context, info) => {
      return User.findByPk(id);
    },
    afterResolver:async (parent, { id }, context, info)=>{},
    onError(err){
    // this will be called before err get passed to apollo server's error handler
      // will be handy for throwing custom error or do some error checking
    },
// add your mutation, it will take the object with same property shown above
}).addMutation({
  name:"register",
  params:{
    authType:"AuthType!" // just to show using enum type defiend above here as an example
  },
  ....
})

```

## Step 4

in `index.js`, add the following

```js
const { ApolloServer, gql } = require("apollo-server");
const { GraphqlProvider } = require("path/to/graphql-provider"); // make sure this is where the lib exist

// load graphql
GraphqlProvider.load(process.cwd() + "/graphql"); // make sure this is where all the grapql files exist
// server start
GraphqlProvider.start().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
```

# step 5

run `node index.js`, it will use port 4000 as default port

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

# Add Custom Resolver

```js
gql`
  type matchingType {
    targetField : <returnType>
  }
`;

// when the matchingType is called and
// the targetField is requested, the resolver will be called (any value that is return from the previous resolver will end up in the `parent` arg)
GraphqlProvider.addCustomResolver(matchingType, {
  targetField: (parent, args, context, info) => {},
});
```

# Add Query or Mutation

- addQuery(obj) // add to query without prefix
- addMutation(obj) // add to mutation without prefix
- creat(obj) // add to Mutation with "create" prefix
- get(obj) // add to Mutation with "get" prefix
- update(obj) // add to Mutation with "update" prefix
- delete(obj) // add to Mutation with "delete" prefix

The method above all take the same object below

```js
{
  name: "User", // query name
  description: "get self basic info", // description
  type: `User`, // return type
  params:{
    foo:"String" // the object in the params will
    bar:"String!"            // endup in the 'args' paramter
                  // of the resolver and its hook
                  // below
  },
  // before resolver is called
  beforeResolve(parent, args , context,info){

  },
  // after resolver is called
  afterResolve(parent, args , context,info){

  },
  // resolver for the Query or Mutation
  resolver(parent, args , context,info){

  }
  // will be called if there is error (this will skip the "global error" hook)
  onError(err){

  },
}
```

# Event Hook (life cycle)

## Global Hook

```js
// add this to you index.js or somewhere in the loader folder.

GraphqlProvider.beforeResolve((parent, args, context, info) => {
  console.log("global before resolved called");
});

GraphqlProvider.afterResolve((parent, args, context, info) => {
  console.log("global after resolved called");
});

// if local onError is not defined, this will be called
// make sure err is only the subclass of Error object
// (better to just use ApolloError)
// and throw the error out eventually
GraphqlProvider.onError((err) => {
  errorHanlder(err);
});
```

## Life cycle flow

**Resolver Hook:**

- `Global BeforeResolve` => `Local Before Resolve` => `Local After Resolve` => `Global After Resolve`

**Error Hook:**

- either `Global Error` or `local OnError` (if `onError` is defined locally in `AddQuery`, `AddMutation`, etc. , global Error will be skipped).

# Middleware

- **filebased** middleware is provided.

first using following files structure as example:

```console
├─ graphql/
│  ├─ admin/
│  │  ├─ _middleware.js (middleware 2)
│  │  ├─ Admin.js
│  ├─ _middleware.js  (middleware 1)
│  ├─ User.js
```

if `resolver` in `User.js` is called, "before" resolver life cycle start, middleware 1 will be called, then resolvers in User.js

if `resolver` in `Admin.js` is called, "before" resolver life cycle start, `middleware 1` will be called first, then `middleware 2`, then resolves in Admins.js

etc.

Each middleware will take args (the same 4 args through out the whole life cycle), and will be pass down to each stage of the life cycle

```js
// _middleware.js
module.exports = async (parent, args, context, info) => {
  // do anything you want before calling the resolver of query or mutation (check token, access level check,logging, etc.)
};
```

# Standardizing 'name'

Since graphql is just a single point of api, it is not like REST api that uses GET, POST, DELETE,...etc, request name to tell user what the api is going to do to the data. Therefore, it is better to have a more Standardized way naming the 'name' for the Query and Mutation to make the api more intuitive by its name.

To have a more REST api experiences, uses the following method to add new Query and Mutation

below show the 4 methods provided by the provider and it will add a prefix to the 'name' and add it to Mutation or Query based on its api type.

```js
// this will add `getUser` to Query (get resources)
GraphqlProvider.get({
  name: "User", // query name
  description: "get self basic info", //description
  params:{
    foo:"String" //  parameters
    bar:"String!" // '!' meant required
  },
  type: `User`, // return type
  beforeResolve(parent, args , context,info){

  },
  afterResolve(parent, args , context,info){

  },
  onError(parent, args , context,info){

  },
  resolver(parent, args , context,info){

  }
});
// this will add `createUser` to Mutation (create resources)
GraphqlProvider.create({
  name: "User",
  ...
});
// this will add `updateUser` to Mutation (update resources)
GraphqlProvider.update({
  name: "User",
  ...
});
// this will add `deleteUser` to Mutation (delete resources)
GraphqlProvider.delete({
  name: "User",
  ...
});
```
