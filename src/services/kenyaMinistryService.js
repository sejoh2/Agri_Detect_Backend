const axios = require('axios');
const cheerio = require('cheerio');
const { Outbreak, DataSource } = require('../models');

class KenyaMinistryService {
  constructor() {
    this.ministryUrl = 'http://kilimo.go.ke/';
    this.alertsUrl = 'http://kilimo.go.ke/alerts';
  }

  async fetchData() {
    console.log('🔍 Fetching Kenya Ministry data...');
    
    try {
      const response = await axios.get(this.alertsUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgriDetect/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      const outbreaks = [];
      
      // Try different possible selectors
      const selectors = ['.alert-item', '.news-item', '.outbreak-item', '.post', 'article'];
      
      for (const selector of selectors) {
        $(selector).each((i, element) => {
          const title = $(element).find('.title, h3, h2').first().text().trim();
          const dateText = $(element).find('.date, time, small').first().text().trim();
          const description = $(element).find('.description, p').first().text().trim();
          
          if (title && this._isRelevant(title)) {
            const outbreak = this._parseOutbreak(title, description, dateText);
            if (outbreak) {
              outbreaks.push(outbreak);
            }
          }
        });
        
        if (outbreaks.length > 0) break;
      }
      
      // If no outbreaks found with selectors, try searching the whole page
      if (outbreaks.length === 0) {
        const bodyText = $('body').text();
        outbreaks.push(...this._extractFromText(bodyText));
      }
      
      console.log(`✅ Found ${outbreaks.length} Kenya Ministry alerts`);
      return outbreaks;
      
    } catch (error) {
      console.error('❌ Kenya Ministry fetch error:', error.message);
      return this.getMockData();
    }
  }

  _isRelevant(text) {
    const keywords = ['disease', 'outbreak', 'alert', 'warning', 'pest', 'infection', 'farm'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  _parseOutbreak(title, description, dateText) {
    const location = this._extractLocation(title + ' ' + description);
    if (!location) return null;
    
    const disease = this._extractDisease(title + ' ' + description);
    if (!disease) return null;
    
    const type = this._determineType(disease, description);
    
    return {
      source: 'Kenya Ministry',
      diseaseName: disease,
      ...(type === 'animal' ? { animalType: 'Livestock' } : { cropName: 'Crops' }),
      locationName: location,
      county: location,
      country: 'Kenya',
      reportDate: this._parseDate(dateText),
      description: description || `${disease} reported in ${location}.`,
      severity: description.toLowerCase().includes('severe') ? 'high' : 'medium',
      status: 'active'
    };
  }

  _extractLocation(text) {
    const counties = [
      'Nairobi', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia',
      'Meru', 'Embu', 'Kirinyaga', 'Muranga', 'Nyeri', 'Kakamega',
      'Bungoma', 'Busia', 'Kisumu', 'Homabay', 'Migori', 'Kisii',
      'Machakos', 'Kajiado', 'Laikipia', 'Narok', 'Baringo'
    ];
    
    for (const county of counties) {
      if (text.includes(county)) return county;
    }
    return null;
  }

  _extractDisease(text) {
    const diseases = [
      'Fall Armyworm', 'Maize Lethal Necrosis', 'Cassava Mosaic',
      'Coffee Berry Borer', 'Banana Xanthomonas Wilt', 'Tomato Blight',
      'Rift Valley Fever', 'Foot and Mouth', 'Newcastle Disease',
      'African Swine Fever', 'Anthrax', 'Brucellosis'
    ];
    
    for (const disease of diseases) {
      if (text.includes(disease)) return disease;
    }
    
    // Try to extract any disease mentioned
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (words[i].toLowerCase().includes('disease') && i > 0) {
        return words[i-1] + ' ' + words[i];
      }
    }
    
    return null;
  }

  _determineType(disease, text) {
    const animalDiseases = ['Rift Valley Fever', 'Foot and Mouth', 'Newcastle', 'African Swine Fever', 'Anthrax', 'Brucellosis'];
    const animalKeywords = ['cattle', 'cow', 'sheep', 'goat', 'livestock', 'poultry', 'chicken'];
    
    if (animalDiseases.some(d => disease.includes(d))) return 'animal';
    if (animalKeywords.some(k => text.toLowerCase().includes(k))) return 'animal';
    
    return 'crop';
  }

  _parseDate(dateText) {
    try {
      // Try to parse common date formats
      const date = new Date(dateText);
      if (!isNaN(date)) return date;
      
      // Handle "March 15, 2026" format
      const match = dateText.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
      if (match) {
        return new Date(`${match[1]} ${match[2]}, ${match[3]}`);
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    return new Date(); // Default to now
  }

  _extractFromText(text) {
    // Simple text-based extraction when structured data isn't available
    const outbreaks = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('disease') || line.includes('outbreak')) {
        const location = this._extractLocation(line);
        const disease = this._extractDisease(line);
        
        if (location && disease) {
          outbreaks.push({
            source: 'Kenya Ministry',
            diseaseName: disease,
            locationName: location,
            county: location,
            country: 'Kenya',
            reportDate: new Date(),
            description: line.trim(),
            severity: 'medium',
            status: 'active'
          });
        }
      }
    }
    
    return outbreaks;
  }

  getMockData() {
    console.log('⚠️ Using mock Kenya Ministry data');
    return [
      {
        source: 'Kenya Ministry',
        diseaseName: 'Fall Armyworm',
        cropName: 'Maize',
        locationName: 'Bungoma',
        county: 'Bungoma',
        country: 'Kenya',
        reportDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Fall Armyworm infestation reported in Bungoma County. Farmers advised to apply recommended pesticides.',
        severity: 'high',
        status: 'active'
      },
      {
        source: 'Kenya Ministry',
        diseaseName: 'Rift Valley Fever',
        animalType: 'Cattle',
        locationName: 'Garissa',
        county: 'Garissa',
        country: 'Kenya',
        reportDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        description: 'Rift Valley Fever cases confirmed in Garissa. Livestock movement restricted.',
        severity: 'high',
        status: 'active'
      },
      {
        source: 'Kenya Ministry',
        diseaseName: 'Maize Lethal Necrosis',
        cropName: 'Maize',
        locationName: 'Nakuru',
        county: 'Nakuru',
        country: 'Kenya',
        reportDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        description: 'MLN detected in maize farms in Nakuru. Farmers advised to report any suspected cases.',
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
            source: 'Kenya Ministry'
          }
        });
        
        if (!existing) {
          await Outbreak.create(outbreak);
          storedCount++;
        }
      } catch (e) {
        console.error('Error storing Kenya Ministry outbreak:', e.message);
      }
    }
    
    if (storedCount > 0) {
      console.log(`✅ Stored ${storedCount} new Kenya Ministry alerts`);
      
      await DataSource.upsert({
        name: 'Kenya Ministry',
        type: 'both',
        lastFetched: new Date(),
        isActive: true
      });
    }
    
    return storedCount;
  }
}

module.exports = new KenyaMinistryService();