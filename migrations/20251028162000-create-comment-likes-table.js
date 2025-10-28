"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { tableName: "comment_likes", schema: "storie" },
      {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },
        commentId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: { tableName: "users", schema: "public" },
            key: "id",
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      }
    );

    await queryInterface.addIndex(
      { tableName: "comment_likes", schema: "storie" },
      ["commentId", "userId"],
      { unique: true, name: "comment_likes_commentId_userId_unique" }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      { tableName: "comment_likes", schema: "storie" },
      "comment_likes_commentId_userId_unique"
    );
    await queryInterface.dropTable({ tableName: "comment_likes", schema: "storie" });
  },
};


