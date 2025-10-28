'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'users', schema: 'user' },
      'subscribersCount',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    ).catch(e => console.log(e));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'users', schema: 'user' },
      'subscribersCount'
    ).catch(e => console.log(e));
  },
};

