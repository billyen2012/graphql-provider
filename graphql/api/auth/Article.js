const { GraphqlProvider } = require("../../../graphql-provider");
const Article = require("../../../model/Article");
const User = require("../../../model/User");
const { AuthenticationError } = require("apollo-server");
const { Op } = require("sequelize");

Article.hasOne(User, { foreignKey: "id" });

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
`
)
  // get user's self article
  .get({
    name: "MyArticles",
    description: "get all articles belong to self",
    type: "[Article]",
    resolver: async (parent, args, context, info) => {
      return Article.findAll({ where: { userId: context.user.id } }).then(
        (articles) => {
          if (!articles) return null;
          return articles.map((e) => e.toJSON());
        }
      );
    },
  })
  // get all articles (include private if is created by self)
  .get({
    name: "Articles",
    description: "get all the public articles and article belong to self",
    type: "[Article]",
    resolver: async (parent, args, context, info) => {
      return Article.findAll({
        where: {
          [Op.or]: [{ visibility: "PUBLIC" }, { userId: context.user.id }],
        },
        include: User,
      }).then((articles) => {
        if (!articles) return null;
        return articles.map((e) => e.toJSON());
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
      return Article.findByPk(id, { include: User }).then((e) => {
        if (!e) return null;
        if (e.visibility === "PRIVATE" && context.user.id !== e.userId)
          throw new AuthenticationError(
            "this is a private article that own by other"
          );
        return e.toJSON();
      });
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
