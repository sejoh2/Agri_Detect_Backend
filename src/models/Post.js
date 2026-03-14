const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
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
  // REMOVE these fields - they'll come from Users table
  // authorName: { type: DataTypes.STRING, allowNull: false },
  // authorLocation: { type: DataTypes.STRING, allowNull: false },
  // authorImageUrl: { type: DataTypes.STRING, allowNull: true },
  // isExpert: { type: DataTypes.BOOLEAN, defaultValue: false },
  
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  postImageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'General'
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Post;