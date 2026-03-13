const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Posts',
      key: 'id'
    }
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authorImageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isExpert: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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