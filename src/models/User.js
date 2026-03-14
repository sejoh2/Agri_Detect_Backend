const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  uid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'users_uid_unique',
      msg: 'UID must be unique'
    },
    comment: 'User identifier for fetching specific data'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'users_email_unique',
      msg: 'Email must be unique'
    },
    validate: {
      isEmail: true
    }
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isExpert: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  // Add this to help with existing table conflicts
  indexes: [
    {
      unique: true,
      fields: ['uid'],
      name: 'users_uid_idx'
    },
    {
      unique: true,
      fields: ['email'],
      name: 'users_email_idx'
    }
  ]
});

module.exports = User;