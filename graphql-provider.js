const { gql } = require("apollo-server");
const fs = require("fs");
const { GraphQLScalarType } = require("graphql");

let typedef = [];
let _resolver = { Query: {}, Mutation: {} };

const resolverFunction = ({
  resolver = () => {},
  beforeResolve = () => {},
  onError = null,
}) => {
  return async (parent, args, context, info) => {
    try {
      const response = await beforeResolve(parent, args, context, info);
      if (response) return response;
      return resolver(parent, args, context, info);
    } catch (err) {
      if (typeof onError !== "function") throw err;
      return onError(err);
    }
  };
};

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
  addQuery({
    name = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    typedef.push(gql`
      extend type Query{
        ${name}${getParams(params)}: ${type}
      }
    `);
    _resolver.Query[name] = resolverFunction({
      resolver,
      beforeResolve,
      onError,
    });
    return this;
  },
  addMutation({
    name = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    typedef.push(gql`
      extend type Mutation{
        ${name}${getParams(params)}: ${type}
      }
    `);
    _resolver.Mutation[name] = resolverFunction({
      resolver,
      beforeResolve,
      onError,
    });
    return this;
  },
  get({
    name = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    name = "get" + name;
    return this.addQuery({
      name,
      params,
      type,
      beforeResolve,
      resolver,
      onError,
    });
  },
  post({
    name = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    name = "post" + name;
    return this.addMutation({
      name,
      params,
      type,
      beforeResolve,
      resolver,
      onError,
    });
  },
  put({
    name = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    name = "put" + name;
    return this.addMutation({
      name,
      params,
      type,
      beforeResolve,
      resolver,
      onError,
    });
  },
  delete({
    name = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    name = "delete" + name;
    return this.addMutation({
      name,
      params,
      type,
      beforeResolve,
      resolver,
      onError,
    });
  },
  /**
   * ```js
   * GraphqlProvider.addType({
   *    User: `
   *      id: ID!,
   *      email:String,
   *      username:String,
   *      created_at:String,
   *      updated_at:String
   *    `,
   *    // keep going adding your next type
   *    nextType:`
   *     ...
   *    `
   * })
   * ```
   * @param {Record<string, string>} type
   */
  addType(type = {}) {
    for (let key in type) {
      typedef.push(gql`
      type ${key}{
        ${type[key]}
      }
    `);
    }
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
  addScalarType({
    name,
    description,
    parseValue = () => {},
    serialize = () => {},
    parseLiteral = () => {},
  }) {
    // add to resolver
    _resolver[name] = new GraphQLScalarType({
      name,
      description,
      parseValue,
      serialize,
      parseLiteral,
    });
    // add to type def
    typedef.push(gql`scalar ${name}`);

    return this;
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
