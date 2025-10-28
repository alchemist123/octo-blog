'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = { tableName: 'user_subscriptions', schema: 'user' };
    
    await queryInterface.createTable(table, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      subscriberId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'users', schema: 'user' },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      subscribedToId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'users', schema: 'user' },
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

    // Create unique constraint to prevent duplicate subscriptions
    await queryInterface.addConstraint(table, {
      fields: ['subscriberId', 'subscribedToId'],
      type: 'unique',
      name: 'unique_user_subscription',
    }).catch(e => console.log(e));

    // Add index on subscribedToId for faster queries when getting subscribers
    await queryInterface.addIndex(table, ['subscribedToId'], {
      name: 'idx_user_subscriptions_subscribed_to',
    }).catch(e => console.log(e));

    // Add index on subscriberId for faster queries when getting who user is following
    await queryInterface.addIndex(table, ['subscriberId'], {
      name: 'idx_user_subscriptions_subscriber',
    }).catch(e => console.log(e));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'user_subscriptions', schema: 'user' }).catch(e => console.log(e));
  },
};

