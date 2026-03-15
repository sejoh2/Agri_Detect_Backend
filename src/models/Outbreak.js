const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Outbreak = sequelize.define('Outbreak', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID from data_sources table'
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'FAO EMPRES-i, FAO Plant Pests, Kenya Ministry, etc.'
  },
  diseaseName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // For crop diseases
  cropName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // For animal diseases
  animalType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  locationName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  county: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Kenyan county if applicable'
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'Kenya'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  reportDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'confirmed', 'resolved', 'pending'),
    defaultValue: 'active'
  },
  severity: {
    type: DataTypes.ENUM('high', 'medium', 'low', 'info'),
    defaultValue: 'medium'
  },
  cases: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  externalUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID from original source'
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
      fields: ['locationName', 'county']
    },
    {
      fields: ['reportDate']
    },
    {
      fields: ['diseaseName']
    },
    {
      fields: ['source']
    }
  ]
});

module.exports = Outbreak;