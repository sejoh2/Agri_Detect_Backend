const express = require('express');
const router = express.Router();
const {
  getNearbyOutbreaks,
  getOutbreakById,
  triggerFetch,
  getPreventionGuide,
  updateUserLocation,
  getUserLocation
} = require('../controllers/outbreakController');

// User location routes
router.post('/user/:uid/location', updateUserLocation);
router.get('/user/:uid/location', getUserLocation);

// Public routes
router.get('/nearby', getNearbyOutbreaks);
router.get('/guide/:disease', getPreventionGuide);
router.get('/:id', getOutbreakById);

// Admin route (you can add authentication later)
router.post('/fetch', triggerFetch);

module.exports = router;