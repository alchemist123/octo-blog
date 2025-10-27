'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createSchema("user")  
  },

  async down (queryInterface, Sequelize) {
    queryInterface.dropSchema("user");
  }
};
