"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the comments table
    await queryInterface.dropTable(
      { tableName: "comments", schema: "storie" }
    );
  },

  async down(queryInterface, Sequelize) {
    // Recreate the comments table if rollback is needed
    await queryInterface.createTable(
      { tableName: "comments", schema: "storie" },
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        storyId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: { tableName: "stories", schema: "storie" },
            key: "id",
          },
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: { tableName: "users", schema: "public" },
            key: "id",
          },
        },
        parentId: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        likesCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
  },
};

