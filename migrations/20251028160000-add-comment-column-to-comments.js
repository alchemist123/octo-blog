"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: "comments", schema: "storie" },
      "comment",
      { type: Sequelize.TEXT, allowNull: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: "comments", schema: "storie" },
      "comment"
    );
  },
};


