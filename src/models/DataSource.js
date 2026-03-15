const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DataSource = sequelize.define('DataSource', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('animal', 'crop', 'weather', 'both'),
    allowNull: false
  },
  lastFetched: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fetchUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = DataSource;