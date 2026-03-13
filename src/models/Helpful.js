const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Helpful = sequelize.define('Helpful', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING, // Firebase UID
    allowNull: false,
    comment: 'Firebase user ID'
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Posts',
      key: 'id'
    }
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('post', 'comment'),
    allowNull: false
  }
}, {
  // Ensure a user can only like a post/comment once
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId'],
      name: 'unique_user_post_helpful'
    },
    {
      unique: true,
      fields: ['userId', 'commentId'],
      name: 'unique_user_comment_helpful'
    }
  ]
});

module.exports = Helpful;