const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
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
    allowNull: false,
    references: {
      model: 'Posts',
      key: 'id'
    }
  },
  // REMOVE these fields - they'll come from Users table
  // authorName: { type: DataTypes.STRING, allowNull: false },
  // authorImageUrl: { type: DataTypes.STRING, allowNull: true },
  // isExpert: { type: DataTypes.BOOLEAN, defaultValue: false },
  
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Comment;