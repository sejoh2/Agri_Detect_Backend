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
    comment: 'Firebase UID'
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
  // Display location name (e.g., "Ruiru, Kiambu")
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Coordinates for precise location
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
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
    },
    // Add index for location-based queries
    {
      fields: ['latitude', 'longitude']
    }
  ]
});

module.exports = User;