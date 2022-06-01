# Motivation

This all come to three primary developmental issues of `graphql` I found.

I. `graphql` unnecessarily separate the logic of `Root Type` and its `Resolver` to two different placeses.

so if you create a field for a `Root Type` (either `Query` or `Mutation`), then `resolver` “must” also has a definition for that field. (and vice versa, or `graphql` server will complain and fail)

For instance:

```graphql
type Query{
  # must has a resolver for this field, or gql will fail
  getUser: User
}

const resolvers = {
 # resolver for root type Query
 Query:{
      # for getUser Query, must has this field in Query root type, or gql will fail
      getUser: (parent, args, context, info)=>{}
   }
}
```

But woundn't it be nice if we can just do something like this?

```graphql
# this is much cleaner and intuitive, isn't it?
type Query{
  getUser{
      returnType: User
      resolver:()=>{...}
  }
}
```

However, I can understand why the logic is separated because `type Query{ }` is just not any sort of programming language! (so the example shown above will not work)

But as you can see, the two logics that 'supposedly' required to be in a same place is forced to be separated due to the difference of progamming language, by which causing `graphql` become convoluted.

And I just can not find any npm pacakge that put these two logic back together for JavaScript.

II. No support for `middleware`. There are npm `claim` it is middelware for `graphql`, but only support as `global middleware`, which means that the middeware will always get called for ANY `graphql` request.

III. No support for automatically resolvers and root type loading, which can inevitable cause a bunch of merge conflict and make team development difficut.

So because of the above three issues of `graphql`, I decided to build a npm myself to solve that three developmental issues for good.
