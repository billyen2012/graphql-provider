const { GraphqlProvider } = require("../graphql-provider"); // make sure this is where the lib exist
const User = require("../model/User");

const typeName = "User";

GraphqlProvider.addType(
  typeName,
  `
   id: ID!,
   email:String,
   username:String,
   created_at:String,
   updated_at:String
`
)

  // this method args (QueryName, returnType, Resolver)
  .addQuery({
    name: "user",
    params: {
      id: "ID!",
    },
    type: typeName,
    resolver: async (parent, { id }, context, info) => {
      return User.findByPk(id).then((e) => (e ? e.toJSON() : null));
    },
  })

  .addQuery({
    name: "users",
    type: `[${typeName}]`,
    resolver: async () => {
      return User.findAll().then((e) => e.map((model) => model.toJSON()));
    },
  });
