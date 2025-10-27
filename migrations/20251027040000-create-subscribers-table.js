'use strict';

/** @type {import('sequelize-cli').Migration} */
const table = { tableName: 'subscribers', schema: 'mushroom' };

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
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
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
      fields: ['userId', 'mushroomId'],
      type: 'unique',
      name: 'unique_user_mushroom_subscription',
    }).catch(e => console.log(e));

    // Add check constraint for status values
    await queryInterface.sequelize.query(
      `ALTER TABLE "mushroom"."subscribers" ADD CONSTRAINT "subscribers_status_check" 
       CHECK (status IN ('pending', 'invited', 'joined'))`
    ).catch(e => console.log(e));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(table).catch(e => console.log(e));
  },
};

