const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  inputType: {
    type: DataTypes.ENUM('image', 'audio', 'text'),
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  audioFileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  textInput: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'PROCESSING'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Store the complete Gemini response as JSON
  result: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Extracted fields for easier querying
  diseaseName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('critical', 'warning', 'info'),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Analysis;