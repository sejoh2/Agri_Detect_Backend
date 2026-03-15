const axios = require('axios');
const csv = require('csv-parse');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Outbreak, DataSource } = require('../models');

class FAOAnimalService {
  constructor() {
    // EMPRES-i CSV endpoint
    this.csvUrl = 'http://empres-i.fao.org/csv/outbreaks.csv';
    this.dataDir = path.join(__dirname, '../../data');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async fetchData() {
    console.log('🔍 Fetching FAO EMPRES-i animal disease data...');
    
    try {
      // Download CSV
      const response = await axios.get(this.csvUrl, {
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgriDetect/1.0)'
        }
      });
      
      const filePath = path.join(this.dataDir, `fao_animal_${Date.now()}.csv`);
      const writer = fs.createWriteStream(filePath);
      
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('✅ FAO CSV downloaded:', filePath);
          this.parseCSV(filePath).then(resolve).catch(reject);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('❌ FAO fetch error:', error.message);
      return this.getMockData(); // Fallback to mock data
    }
  }

  parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv.parse({ columns: true, skip_empty_lines: true, relax: true }))
        .on('data', (data) => {
          // Filter for East Africa
          const eastAfricanCountries = ['Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Somalia', 'South Sudan', 'Rwanda', 'Burundi'];
          
          if (eastAfricanCountries.includes(data.COUNTRY)) {
            // Determine severity based on cases
            let severity = 'low';
            const cases = parseInt(data.CASES) || 0;
            if (cases > 100) severity = 'high';
            else if (cases > 20) severity = 'medium';
            
            results.push({
              source: 'FAO EMPRES-i',
              diseaseName: data.DISEASE || 'Unknown disease',
              animalType: data.SPECIES || 'Livestock',
              locationName: data.LOCATION || data.REGION || data.COUNTRY,
              county: data.REGION || data.PROVINCE,
              country: data.COUNTRY,
              reportDate: new Date(data.REPORT_DATE) || new Date(),
              cases: cases,
              status: data.STATUS || 'active',
              severity: severity,
              description: `${data.DISEASE} reported in ${data.LOCATION || data.REGION || data.COUNTRY}. Affects ${data.SPECIES || 'livestock'}.`,
              externalId: data.ID || null
            });
          }
        })
        .on('end', () => {
          console.log(`✅ Parsed ${results.length} FAO animal outbreaks`);
          resolve(results);
        })
        .on('error', reject);
    });
  }

  // Mock data for testing when API is unavailable
  getMockData() {
    console.log('⚠️ Using mock FAO animal data');
    return [
      {
        source: 'FAO EMPRES-i',
        diseaseName: 'Rift Valley Fever',
        animalType: 'Cattle, Sheep',
        locationName: 'Kiambu',
        county: 'Kiambu',
        country: 'Kenya',
        reportDate: new Date(),
        cases: 45,
        status: 'active',
        severity: 'medium',
        description: 'Rift Valley Fever reported in Kiambu County. Affects cattle and sheep.'
      },
      {
        source: 'FAO EMPRES-i',
        diseaseName: 'Foot and Mouth Disease',
        animalType: 'Cattle',
        locationName: 'Nakuru',
        county: 'Nakuru',
        country: 'Kenya',
        reportDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        cases: 120,
        status: 'active',
        severity: 'high',
        description: 'Foot and Mouth Disease outbreak in Nakuru. Affects cattle.'
      },
      {
        source: 'FAO EMPRES-i',
        diseaseName: 'Newcastle Disease',
        animalType: 'Poultry',
        locationName: 'Uasin Gishu',
        county: 'Uasin Gishu',
        country: 'Kenya',
        reportDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        cases: 500,
        status: 'active',
        severity: 'high',
        description: 'Newcastle Disease in poultry farms. High mortality rate.'
      }
    ];
  }

  async storeOutbreaks(outbreaks) {
    let storedCount = 0;
    
    for (const outbreak of outbreaks) {
      try {
        // Check if already exists
        const existing = await Outbreak.findOne({
          where: {
            diseaseName: outbreak.diseaseName,
            locationName: outbreak.locationName,
            reportDate: outbreak.reportDate,
            source: 'FAO EMPRES-i'
          }
        });
        
        if (!existing) {
          await Outbreak.create(outbreak);
          storedCount++;
        }
      } catch (e) {
        console.error('Error storing FAO outbreak:', e.message);
      }
    }
    
    if (storedCount > 0) {
      console.log(`✅ Stored ${storedCount} new FAO outbreaks`);
      
      // Update last fetched timestamp
      await DataSource.upsert({
        name: 'FAO EMPRES-i',
        type: 'animal',
        lastFetched: new Date(),
        isActive: true
      });
    }
    
    return storedCount;
  }
}

module.exports = new FAOAnimalService();