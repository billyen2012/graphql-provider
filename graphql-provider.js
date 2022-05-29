const { gql } = require("apollo-server");
const fs = require("fs");

let typedef = [
  gql`
    type Query
  `,
];
let _resolver = { Query: {} };

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
    return _resolver;
  },
};

module.exports = {
  GraphqlProvider,
};
