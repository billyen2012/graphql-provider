const { GraphqlProvider } = require("../../../graphql-provider");
const Article = require("../../../model/Article");
const User = require("../../../model/User");
const { AuthenticationError, ApolloError } = require("apollo-server");
const { Op } = require("sequelize");
const { customErrorCodes } = require("../../../lib/error");

Article.belongsTo(User, { foreignKey: "userId" });

GraphqlProvider.addType(
  `
  type Article {
    id: ID!,
    userId: Int,
    visibility: Visibility
    User: User
    subject:String,
    content:String,
    createdAt:Date,
    updatedAt:Date
  }
  enum Visibility {
    PUBLIC,
    PRIVATE,
  }
  type CreateArticle{
    code:Int,
    message:String,
  }
  type DeleteArticle{
    code:Int,
    message:String,
  }
  type UpdateArticle{
    code:Int,
    message:String,
  }
`
)
  .addCustomResolver("Article", {
    User: async (parent) => parent.getUser(),
  })
  // get user's self article
  .get({
    name: "MyArticles",
    description: "get all articles belong to self",
    type: "[Article]",
    params: {
      subject: "String",
    },
    resolver: async (parent, { subject }, context, info) => {
      const subjectQuery = {};
      if (subject) subjectQuery.subject = { [Op.like]: `%${subject}%` };
      return Article.findAll({
        where: { userId: context.user.id, ...subjectQuery },
      }).then((articles) => {
        if (!articles) return null;
        return articles;
      });
    },
  })
  // get all articles (include private if is created by self)
  .get({
    name: "Articles",
    description: "get all the public articles and article belong to self",
    type: "[Article]",
    params: {
      subject: "String",
    },
    resolver: async (parent, { subject }, context, info) => {
      const subjectQuery = {};
      if (subject) subjectQuery.subject = { [Op.like]: `%${subject}%` };
      return Article.findAll({
        where: {
          [Op.or]: [{ visibility: "PUBLIC" }, { userId: context.user.id }],
          ...subjectQuery,
        },
      });
    },
  })
  // get one article by ID
  .get({
    name: "Article",
    description: `
    get one article by id
    (if private and not belong to self will be rejected)`,
    type: "Article",
    params: {
      id: "ID!",
    },
    resolver: async (parent, { id }, context, info) => {
      return Article.findByPk(id).then((e) => {
        if (!e) return null;
        if (e.visibility === "PRIVATE" && context.user.id !== e.userId)
          throw new AuthenticationError(
            "this is a private article that own by other"
          );
        return e;
      });
    },
  })
  .delete({
    name: "Article",
    description: "delete an article under self",
    type: "DeleteArticle",
    params: {
      id: "ID!",
    },
    resolver: async (parent, { id }, context, info) => {
      const article = await Article.findByPk(id);
      if (!article)
        throw new ApolloError("article not exist", customErrorCodes.NOT_FOUND);
      if (article.userId !== context.user.id)
        throw new AuthenticationError(
          "This article does not belong to the user"
        );
      return article.destroy().then(() => ({
        code: 200,
        message: `article id ${article.id} has been deleted `,
      }));
    },
  })
  .update({
    name: "Article",
    description: "update an article under self",
    type: "UpdateArticle",
    params: {
      id: "ID!",
      subject: "String!",
      content: "String!",
      visibility: "Visibility!",
    },
    resolver: async (
      parent,
      { id, subject, content, visibility },
      context,
      info
    ) => {
      return Article.findByPk(id)
        .then((article) => {
          // validation
          if (!article)
            throw new ApolloError(
              "artilce not found",
              customErrorCodes.NOT_FOUND
            );

          //  article ownership check

          if (article.userId !== context.user.id)
            throw AuthenticationError(
              "this artilce does not belong to the user"
            );
          // update
          return article.update({
            userId: context.user.id,
            subject,
            content,
            visibility,
          });
        })
        .then((e) => ({
          code: 200,
          message: "create article, article id: " + e.id,
        }));
    },
  })
  // create an article under self
  .create({
    name: "Article",
    description: "create an article under self",
    type: "CreateArticle",
    params: {
      subject: "String!",
      content: "String!",
      visibility: "Visibility!",
    },
    resolver: async (
      parent,
      { subject, content, visibility },
      context,
      info
    ) => {
      return Article.create({
        userId: context.user.id,
        subject,
        content,
        visibility,
      }).then((e) => ({
        code: 200,
        message: "create article, article id: " + e.id,
      }));
    },
  });
