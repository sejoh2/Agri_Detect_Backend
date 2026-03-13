const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authorLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authorImageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
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
  isExpert: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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