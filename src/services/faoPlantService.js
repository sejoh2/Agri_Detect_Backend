const axios = require('axios');
const { parseString } = require('xml2js');
const { Outbreak, DataSource } = require('../models');

class FAOPlantService {
  constructor() {
    // FAO Plant Pest RSS feed
    this.rssUrl = 'https://www.fao.org/plant-pest-reporting/rss.xml';
  }

  async fetchData() {
    console.log('🔍 Fetching FAO plant pest data...');
    
    try {
      const response = await axios.get(this.rssUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgriDetect/1.0)'
        }
      });
      
      const rssData = response.data;
      
      return new Promise((resolve, reject) => {
        parseString(rssData, (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          
          const outbreaks = [];
          
          try {
            const items = result.rss.channel[0].item;
            
            for (const item of items) {
              const title = item.title[0];
              const description = item.description[0];
              const pubDate = new Date(item.pubDate[0]);
              
              // Check if relevant to East Africa
              if (this._isEastAfricaRelevant(title + ' ' + description)) {
                outbreaks.push({
                  source: 'FAO Plant Pests',
                  diseaseName: this._extractDisease(title),
                  cropName: this._extractCrop(title),
                  locationName: this._extractLocation(description),
                  county: this._extractCounty(description),
                  country: 'Kenya',
                  reportDate: pubDate,
                  description: description,
                  severity: 'medium',
                  status: 'active',
                  externalUrl: item.link ? item.link[0] : null
                });
              }
            }
          } catch (e) {
            console.error('Error parsing RSS:', e.message);
          }
          
          console.log(`✅ Parsed ${outbreaks.length} FAO plant outbreaks`);
          resolve(outbreaks);
        });
      });
    } catch (error) {
      console.error('❌ FAO Plant fetch error:', error.message);
      return this.getMockData();
    }
  }

  _isEastAfricaRelevant(text) {
    const keywords = ['Kenya', 'Uganda', 'Tanzania', 'East Africa', 'African', 'Rwanda', 'Burundi'];
    return keywords.some(k => text.includes(k));
  }

  _extractDisease(title) {
    // Common diseases in Kenya
    const diseases = [
      'Fall Armyworm', 'Maize Lethal Necrosis', 'Cassava Mosaic',
      'Coffee Berry Borer', 'Banana Xanthomonas Wilt', 'Tomato Blight',
      'Wheat Rust', 'Rice Blast', 'Citrus Greening'
    ];
    
    for (const disease of diseases) {
      if (title.includes(disease)) return disease;
    }
    
    // If no match, use first part of title
    const parts = title.split('-');
    return parts[0].trim();
  }

  _extractCrop(title) {
    const crops = ['Maize', 'Wheat', 'Cassava', 'Coffee', 'Tea', 'Rice', 'Beans', 'Tomato', 'Banana', 'Citrus'];
    for (const crop of crops) {
      if (title.includes(crop)) return crop;
    }
    return 'Unknown';
  }

  _extractLocation(description) {
    const locations = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi'];
    for (const loc of locations) {
      if (description.includes(loc)) return loc;
    }
    return 'Kenya';
  }

  _extractCounty(description) {
    const counties = [
      'Nairobi', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia',
      'Meru', 'Embu', 'Kirinyaga', 'Muranga', 'Nyeri', 'Kakamega',
      'Bungoma', 'Busia', 'Kisumu', 'Homabay', 'Migori', 'Kisii'
    ];
    
    for (const county of counties) {
      if (description.includes(county)) return county;
    }
    return null;
  }

  getMockData() {
    console.log('⚠️ Using mock FAO plant data');
    return [
      {
        source: 'FAO Plant Pests',
        diseaseName: 'Fall Armyworm',
        cropName: 'Maize',
        locationName: 'Trans Nzoia',
        county: 'Trans Nzoia',
        country: 'Kenya',
        reportDate: new Date(),
        description: 'Fall Armyworm infestation reported in maize farms in Trans Nzoia.',
        severity: 'high',
        status: 'active'
      },
      {
        source: 'FAO Plant Pests',
        diseaseName: 'Maize Lethal Necrosis',
        cropName: 'Maize',
        locationName: 'Nakuru',
        county: 'Nakuru',
        country: 'Kenya',
        reportDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'MLN detected in maize fields in Nakuru County.',
        severity: 'high',
        status: 'active'
      },
      {
        source: 'FAO Plant Pests',
        diseaseName: 'Coffee Berry Borer',
        cropName: 'Coffee',
        locationName: 'Kiambu',
        county: 'Kiambu',
        country: 'Kenya',
        reportDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        description: 'Coffee Berry Borer infestation in coffee plantations.',
        severity: 'medium',
        status: 'active'
      }
    ];
  }

  async storeOutbreaks(outbreaks) {
    let storedCount = 0;
    
    for (const outbreak of outbreaks) {
      try {
        const existing = await Outbreak.findOne({
          where: {
            diseaseName: outbreak.diseaseName,
            locationName: outbreak.locationName,
            reportDate: outbreak.reportDate,
            source: 'FAO Plant Pests'
          }
        });
        
        if (!existing) {
          await Outbreak.create(outbreak);
          storedCount++;
        }
      } catch (e) {
        console.error('Error storing FAO plant outbreak:', e.message);
      }
    }
    
    if (storedCount > 0) {
      console.log(`✅ Stored ${storedCount} new FAO plant outbreaks`);
      
      await DataSource.upsert({
        name: 'FAO Plant Pests',
        type: 'crop',
        lastFetched: new Date(),
        isActive: true
      });
    }
    
    return storedCount;
  }
}

module.exports = new FAOPlantService();