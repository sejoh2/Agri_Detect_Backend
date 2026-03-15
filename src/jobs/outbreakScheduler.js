const cron = require('node-cron');
const outbreakAggregator = require('../services/outbreakAggregator');

class OutbreakScheduler {
  start() {
    console.log('🚀 Starting outbreak data schedulers...');
    
    // Fetch FAO animal data every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 Scheduled: Fetching FAO animal data');
      try {
        const animalData = await require('../services/faoAnimalService').fetchData();
        await require('../services/faoAnimalService').storeOutbreaks(animalData);
      } catch (e) {
        console.error('Scheduled FAO animal fetch error:', e.message);
      }
    });
    
    // Fetch FAO plant data every 12 hours
    cron.schedule('0 */12 * * *', async () => {
      console.log('🔄 Scheduled: Fetching FAO plant data');
      try {
        const plantData = await require('../services/faoPlantService').fetchData();
        await require('../services/faoPlantService').storeOutbreaks(plantData);
      } catch (e) {
        console.error('Scheduled FAO plant fetch error:', e.message);
      }
    });
    
    // Fetch Kenya Ministry data every 24 hours at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('🔄 Scheduled: Fetching Kenya Ministry data');
      try {
        const ministryData = await require('../services/kenyaMinistryService').fetchData();
        await require('../services/kenyaMinistryService').storeOutbreaks(ministryData);
      } catch (e) {
        console.error('Scheduled Kenya Ministry fetch error:', e.message);
      }
    });
    
    // Initial fetch on startup (after 10 seconds)
    setTimeout(async () => {
      console.log('🔄 Initial data fetch starting...');
      await outbreakAggregator.fetchAllSources();
    }, 10000);
    
    console.log('✅ Outbreak schedulers started');
  }
}

module.exports = new OutbreakScheduler();