'use strict';

/** @type {import('sequelize-cli').Migration} */
const table = { tableName: 'users', schema: 'user' };

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(table, 'interests', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      defaultValue: []
    }).catch(e => console.log(e));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(table, 'interests').catch(e => console.log(e));
  },
};
