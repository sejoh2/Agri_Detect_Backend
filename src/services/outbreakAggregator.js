const { Op } = require('sequelize');
const { Outbreak } = require('../models');
const faoAnimalService = require('./faoAnimalService');
const faoPlantService = require('./faoPlantService');
const kenyaMinistryService = require('./kenyaMinistryService');

class OutbreakAggregator {
  constructor() {
    this.services = [
      { name: 'FAO Animal', service: faoAnimalService, type: 'animal' },
      { name: 'FAO Plant', service: faoPlantService, type: 'crop' },
      { name: 'Kenya Ministry', service: kenyaMinistryService, type: 'both' }
    ];
  }

  // Get outbreaks near user location
  async getNearbyOutbreaks(lat, lon, radiusKm = 100, type = 'all') {
    try {
      console.log(`📊 Fetching outbreaks near (${lat}, ${lon}) within ${radiusKm}km`);
      
      const whereClause = {
        status: 'active',
        reportDate: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      };
      
      // Filter by type if specified
      if (type === 'animal') {
        whereClause.animalType = { [Op.ne]: null };
      } else if (type === 'crop') {
        whereClause.cropName = { [Op.ne]: null };
      }
      
      const outbreaks = await Outbreak.findAll({
        where: whereClause,
        order: [['reportDate', 'DESC']],
        limit: 100
      });
      
      // For now, return all outbreaks (distance filtering will be added later with PostGIS)
      return {
        success: true,
        count: outbreaks.length,
        outbreaks: outbreaks.map(o => this._formatOutbreak(o))
      };
      
    } catch (error) {
      console.error('❌ Error fetching outbreaks:', error);
      return {
        success: false,
        error: 'Failed to fetch outbreaks',
        outbreaks: []
      };
    }
  }

  // Get a single outbreak by ID
  async getOutbreakById(id) {
    try {
      const outbreak = await Outbreak.findByPk(id);
      
      if (!outbreak) {
        return { success: false, error: 'Outbreak not found' };
      }
      
      return {
        success: true,
        outbreak: this._formatOutbreak(outbreak)
      };
    } catch (error) {
      console.error('❌ Error fetching outbreak:', error);
      return { success: false, error: 'Failed to fetch outbreak' };
    }
  }

  // Format outbreak for frontend
  _formatOutbreak(outbreak) {
    const data = outbreak.toJSON();
    
    // Add time ago
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(data.reportDate)) / 1000);
    
    let timeAgo = 'Just now';
    if (diffInSeconds < 60) timeAgo = `${diffInSeconds} seconds ago`;
    else if (diffInSeconds < 3600) timeAgo = `${Math.floor(diffInSeconds / 60)} minutes ago`;
    else if (diffInSeconds < 86400) timeAgo = `${Math.floor(diffInSeconds / 3600)} hours ago`;
    else if (diffInSeconds < 604800) timeAgo = `${Math.floor(diffInSeconds / 86400)} days ago`;
    else timeAgo = `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    
    // Determine subtitle based on type
    let subtitle = '';
    if (data.cropName) {
      subtitle = `Affects ${data.cropName}`;
    } else if (data.animalType) {
      subtitle = `Affects ${data.animalType}`;
    } else {
      subtitle = 'Agricultural alert';
    }
    
    return {
      id: data.id,
      title: data.diseaseName,
      subtitle: subtitle,
      location: data.locationName,
      county: data.county,
      description: data.description || `${data.diseaseName} reported in ${data.locationName}.`,
      type: data.cropName ? 'disease' : 'disease', // Both are disease type for now
      source: data.source,
      severity: data.severity,
      diseaseName: data.diseaseName,
      affectedCrops: data.cropName ? [data.cropName] : [],
      affectedAnimals: data.animalType ? [data.animalType] : [],
      reportDate: data.reportDate,
      timeAgo: timeAgo,
      externalUrl: data.externalUrl
    };
  }

  // Fetch fresh data from all sources
  async fetchAllSources() {
    console.log('🔄 Fetching data from all sources...');
    
    const results = {
      faoAnimal: 0,
      faoPlant: 0,
      kenyaMinistry: 0
    };
    
    // Fetch from FAO Animal
    try {
      console.log('📡 Fetching FAO Animal data...');
      const animalData = await faoAnimalService.fetchData();
      results.faoAnimal = await faoAnimalService.storeOutbreaks(animalData);
      console.log(`✅ FAO Animal: stored ${results.faoAnimal} new outbreaks`);
    } catch (e) {
      console.error('❌ Error in FAO Animal fetch:', e.message);
    }
    
    // Fetch from FAO Plant
    try {
      console.log('📡 Fetching FAO Plant data...');
      const plantData = await faoPlantService.fetchData();
      results.faoPlant = await faoPlantService.storeOutbreaks(plantData);
      console.log(`✅ FAO Plant: stored ${results.faoPlant} new outbreaks`);
    } catch (e) {
      console.error('❌ Error in FAO Plant fetch:', e.message);
    }
    
    // Fetch from Kenya Ministry
    try {
      console.log('📡 Fetching Kenya Ministry data...');
      const ministryData = await kenyaMinistryService.fetchData();
      results.kenyaMinistry = await kenyaMinistryService.storeOutbreaks(ministryData);
      console.log(`✅ Kenya Ministry: stored ${results.kenyaMinistry} new outbreaks`);
    } catch (e) {
      console.error('❌ Error in Kenya Ministry fetch:', e.message);
    }
    
    console.log('✅ Fetch complete:', results);
    return results;
  }
}

// Create and export a single instance
const outbreakAggregator = new OutbreakAggregator();
module.exports = outbreakAggregator;