'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createSchema('storie');
  },

  async down(queryInterface, Sequelize) {
    queryInterface.dropSchema('storie');
  },
};

