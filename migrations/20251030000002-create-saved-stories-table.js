'use strict';

/** @type {import('sequelize-cli').Migration} */
const table = { tableName: 'saved_stories', schema: 'storie' };

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(table, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      storyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'stories', schema: 'storie' },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    // Unique per user per story
    await queryInterface.addConstraint(table, {
      fields: ['userId', 'storyId'],
      type: 'unique',
      name: 'unique_user_story_save',
    }).catch(e => console.log(e));

    await queryInterface.addIndex(table, ['userId'], { name: 'idx_saved_stories_user' }).catch(e => console.log(e));
    await queryInterface.addIndex(table, ['storyId'], { name: 'idx_saved_stories_story' }).catch(e => console.log(e));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(table).catch(e => console.log(e));
  },
};


