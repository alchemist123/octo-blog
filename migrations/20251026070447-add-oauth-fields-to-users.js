'use strict';

/** @type {import('sequelize-cli').Migration} */
const table = { tableName: 'users', schema: 'user' };

module.exports = {
  async up (queryInterface, Sequelize) {
    // Make some fields nullable for OAuth users
    await queryInterface.changeColumn(table, 'dp_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn(table, 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn(table, 'bio', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn(table, 'location', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn(table, 'personal_website', {
      type: Sequelize.ARRAY(Sequelize.JSON),
      allowNull: true,
    });

    // Add OAuth fields
    await queryInterface.addColumn(table, 'provider', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'local',
    });

    await queryInterface.addColumn(table, 'providerId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove OAuth fields
    await queryInterface.removeColumn(table, 'provider');
    await queryInterface.removeColumn(table, 'providerId');

    // Revert column changes
    await queryInterface.changeColumn(table, 'dp_url', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn(table, 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn(table, 'bio', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn(table, 'location', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn(table, 'personal_website', {
      type: Sequelize.ARRAY(Sequelize.JSON),
      allowNull: false,
    });
  }
};
