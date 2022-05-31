const { GraphqlProvider } = require("../../graphql-provider");
const Article = require("../../model/Article");
const User = require("../../model/User");

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
  .get({
    name: "Article",
    type: "Article",
    params: {
      id: "ID!",
    },
    resolver: async (parent, { id }, context, info) => {
      return Article.findByPk(id, { include: User }).then((e) =>
        e ? e.toJSON() : null
      );
    },
  })
  // create an article
  .post({
    name: "Article",
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
