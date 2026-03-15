const axios = require('axios');

class GeocodingService {
  constructor() {
    // Using OpenStreetMap's Nominatim API (free, no key required)
    this.baseUrl = 'https://nominatim.openstreetmap.org/reverse';
  }

  async getLocationName(lat, lon) {
    try {
      console.log(`🔍 Getting location name for (${lat}, ${lon})`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          lat: lat,
          lon: lon,
          format: 'json',
          zoom: 14, // City/town level
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'AgriDetect/1.0' // Required by Nominatim
        },
        timeout: 5000
      });

      if (response.data && response.data.address) {
        const address = response.data.address;
        
        // Construct a readable location name
        const parts = [];
        
        // Try to get village/town/city
        if (address.village) parts.push(address.village);
        else if (address.town) parts.push(address.town);
        else if (address.city) parts.push(address.city);
        else if (address.suburb) parts.push(address.suburb);
        
        // Add county/district
        if (address.county) parts.push(address.county);
        else if (address.state_district) parts.push(address.state_district);
        
        // Add country (optional)
        // if (address.country) parts.push(address.country);
        
        const locationName = parts.join(', ');
        console.log(`✅ Location name found: ${locationName}`);
        return locationName;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Geocoding error:', error.message);
      return null;
    }
  }

  // Alternative: Use Google Maps Geocoding API (requires API key)
  async getLocationNameWithGoogle(lat, lon) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.log('⚠️ Google Maps API key not found');
        return null;
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            latlng: `${lat},${lon}`,
            key: apiKey,
            result_type: 'locality|administrative_area_level_2'
          }
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Google Geocoding error:', error.message);
      return null;
    }
  }
}

module.exports = new GeocodingService();