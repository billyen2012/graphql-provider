const { gql } = require("apollo-server");
const fs = require("fs");

let typedef = [];
let _resolver = { Query: {}, Mutation: {} };

const getParams = (params = {}) => {
  // (id: ID!)
  const arr = [];
  for (let key in params) {
    arr.push(`${key}:${params[key]}`);
  }
  const paramsString = arr.join(",");
  return paramsString === "" ? "" : "(" + paramsString + ")";
};
const GraphqlProvider = {
  addQuery({ name = "", params = {}, type = "", resolver = () => {} }) {
    typedef.push(gql`
      extend type Query{
        ${name}${getParams(params)}: ${type}
      }
    `);
    _resolver.Query[name] = resolver;
    return this;
  },
  addMutation({ name = "", params = {}, type = "", resolver = () => {} }) {
    typedef.push(gql`
      extend type Mutation{
        ${name}${getParams(params)}: ${type}
      }
    `);
    _resolver.Mutation[name] = resolver;
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
    // load all the files under the path
    const files = fs.readdirSync(path);
    for (let file of files) {
      require(`${path}/${file}`);
    }
    // push root type to the front
    const hasMutation = Object.keys(_resolver.Mutation).length > 0;
    const hasQuery = Object.keys(_resolver.Query).length > 0;

    if (hasMutation)
      typedef.unshift(
        gql`
          type Mutation
        `
      );
    // appolo server will complain if not delete
    else delete _resolver.Mutation;

    if (hasQuery)
      typedef.unshift(
        gql`
          type Query
        `
      );
    // appolo server will complain if not delete
    else delete _resolver.Query;
  },
  get typeDefs() {
    return typedef;
  },
  get resolvers() {
    return _resolver;
  },
};

module.exports = {
  GraphqlProvider,
};
