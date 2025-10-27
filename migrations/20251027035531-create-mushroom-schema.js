'use strict';

/** @type {import('sequelize-cli').Migration} */
const table = { tableName: "mushrooms", schema: "mushroom" }
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createSchema("mushroom")  
  },

  async down (queryInterface, Sequelize) {
    queryInterface.dropSchema("mushroom");
  }
};
