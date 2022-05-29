const { gql } = require("apollo-server");
const fs = require("fs");

let typedef = [
  gql`
    type Query
  `,
];
let resolver = { Query: {} };

const GraphqlProvider = {
  addQuery(name, type, resolverCallback) {
    typedef.push(gql`
      extend type Query{
        ${name}: ${type}
      }
    `);
    resolver.Query[name] = resolverCallback;
    return this;
  },
  addType(name, typeString) {
    typedef.push(gql`
      type ${name}{
        ${typeString}
      }
    `);
    return this;
  },
  load(path) {
    const files = fs.readdirSync(path);
    for (let file of files) {
      require(`${path}/${file}`);
    }
  },
  get typeDefs() {
    return typedef;
  },
  get resolvers() {
    return resolver;
  },
};

module.exports = {
  GraphqlProvider,
};
