const { gql } = require("apollo-server");
const fs = require("fs");
const { GraphQLScalarType } = require("graphql");

let typedef = [];
let _resolver = { Query: {}, Mutation: {} };
let defaultError = null;
let globalBeforeResolve = () => {};
let globalAfterResolve = () => {};
let _middleware_ = null;

const fileLoader = (path) => {
  const files = fs.readdirSync(path);
  // if there is middleware add set it to var _middleware_
  // , where it will be cache for each layer of files for the resolvers
  const middlewareFileName = "_middleware.js";
  if (files.includes(middlewareFileName)) {
    const middlewareIndex = files.indexOf(middlewareFileName);
    _middleware_ = require(`${path}/${files[middlewareIndex]}`);
    // remove _middeware from files array after load
    files.splice(middlewareIndex, 1);
  } else {
    _middleware_ = null;
  }

  const directories = [];
  // start loading files
  files.forEach((file) => {
    const fileState = fs.statSync(`${path}/${file}`);
    if (fileState.isFile()) return require(`${path}/${file}`);
    if (fileState.isDirectory()) return directories.push(file);
  });

  // then load sub directories recursively
  directories.forEach((directory) => {
    fileLoader(`${path}/${directory}`);
  });
};

const resolverFunction = ({
  resolver = () => {},
  beforeResolve = () => {},
  afterResolve = () => {},
  _middleware = () => {},
  onError = null,
}) => {
  // cache middleware per layer of files loader
  if (_middleware_) _middleware = _middleware_;
  return async (parent, args, context, info) => {
    try {
      // global before resolve
      const globalBeforeResolveResponse = await globalBeforeResolve(
        parent,
        args,
        context,
        info
      );

      if (globalBeforeResolveResponse) return globalBeforeResolveResponse;

      // middleware before enter to local
      const middlewareResponse = await _middleware(parent, args, context, info);

      if (middlewareResponse) return middlewareResponse;

      // local before resolve
      const beforeResolveResponse = await beforeResolve(
        parent,
        args,
        context,
        info
      );

      if (beforeResolveResponse) return beforeResolveResponse;

      // resolver
      const resolveResponse = await resolver(parent, args, context, info);
      return resolveResponse;
    } catch (err) {
      if (typeof onError !== "function" && typeof defaultError !== "function")
        throw err;
      return typeof onError === "function" ? onError(err) : defaultError(err);
    } finally {
      // local after resolve
      afterResolve(parent, args, context, info);

      // global after resolve
      globalAfterResolve(parent, args, context, info);
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
  beforeResolve(callback = () => {}) {
    globalBeforeResolve = callback;
  },
  afterResolve(callback = () => {}) {
    globalAfterResolve = callback;
  },
  onError(errorCallback = () => {}) {
    defaultError = errorCallback;
  },
  addQuery({
    name = "",
    description = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    resolver = () => {},
    afterResolve = () => {},
    onError = null,
  }) {
    typedef.push(gql`

      extend type Query{
        """
        ${description}
        """
        ${name}${getParams(params)}: ${type}
      }
    `);
    _resolver.Query[name] = resolverFunction({
      resolver,
      beforeResolve,
      afterResolve,
      onError,
    });
    return this;
  },
  addMutation({
    name = "",
    description = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    afterResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    typedef.push(gql`
      extend type Mutation{
        """
        ${description}
        """
        ${name}${getParams(params)}: ${type}
      }
    `);
    _resolver.Mutation[name] = resolverFunction({
      resolver,
      beforeResolve,
      afterResolve,
      onError,
    });
    return this;
  },
  get({
    name = "",
    description = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    afterResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    name = "get" + name;
    return this.addQuery({
      name,
      description,
      params,
      type,
      beforeResolve,
      afterResolve,
      resolver,
      onError,
    });
  },
  create({
    name = "",
    description = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    resolver = () => {},
    afterResolve = () => {},
    onError = null,
  }) {
    name = "create" + name;
    return this.addMutation({
      name,
      description,
      params,
      type,
      beforeResolve,
      afterResolve,
      resolver,
      onError,
    });
  },
  update({
    name = "",
    description = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    afterResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    name = "update" + name;
    return this.addMutation({
      name,
      description,
      params,
      type,
      beforeResolve,
      afterResolve,
      resolver,
      onError,
    });
  },
  delete({
    name = "",
    description = "",
    params = {},
    type = "",
    beforeResolve = () => {},
    afterResolve = () => {},
    resolver = () => {},
    onError = null,
  }) {
    name = "delete" + name;
    return this.addMutation({
      name,
      description,
      params,
      type,
      beforeResolve,
      afterResolve,
      resolver,
      onError,
    });
  },
  /**@gql */
  addType(type) {
    typedef.push(
      gql`
        ${type}
      `
    );
    return this;
  },
  load(path) {
    // load all the files under the path
    fileLoader(path);
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
  get context() {
    return ({ req, res }) => {
      return { req, res };
    };
  },
};

module.exports = {
  GraphqlProvider,
};
