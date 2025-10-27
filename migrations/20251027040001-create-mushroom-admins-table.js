'use strict';

/** @type {import('sequelize-cli').Migration} */
const table = { tableName: 'mushroom_admins', schema: 'mushroom' };

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(table, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'users', schema: 'user' },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      mushroomId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'mushrooms', schema: 'mushroom' },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }).catch(e => console.log(e));

    // Create unique constraint to prevent duplicate admin entries
    await queryInterface.addConstraint(table, {
      fields: ['userId', 'mushroomId'],
      type: 'unique',
      name: 'unique_user_mushroom_admin',
    }).catch(e => console.log(e));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(table).catch(e => console.log(e));
  },
};

