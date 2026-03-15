const outbreakAggregator = require('../services/outbreakAggregator');
const geocodingService = require('../services/geocodingService');
const { Outbreak, User } = require('../models');

// Get nearby outbreaks based on user's stored location
const getNearbyOutbreaks = async (req, res) => {
  try {
    const { userId, radius = 100, type = 'all' } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId is required' 
      });
    }

    // Get user's location from database
    const user = await User.findOne({ where: { uid: userId } });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check if user has coordinates stored
    if (!user.latitude || !user.longitude) {
      return res.status(400).json({ 
        success: false, 
        error: 'User location coordinates not set. Please update your location.' 
      });
    }

    console.log(`📍 Fetching outbreaks for user ${userId} at (${user.latitude}, ${user.longitude})`);
    
    const result = await outbreakAggregator.getNearbyOutbreaks(
      parseFloat(user.latitude),
      parseFloat(user.longitude),
      parseInt(radius),
      type
    );
    
    // Add user location to response
    res.json({
      ...result,
      userLocation: {
        lat: parseFloat(user.latitude),
        lon: parseFloat(user.longitude),
        name: user.location
      }
    });
    
  } catch (error) {
    console.error('Error getting outbreaks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch outbreaks' 
    });
  }
};

// Update user location
const updateUserLocation = async (req, res) => {
  try {
    const { uid } = req.params;
    const { latitude, longitude } = req.body;
    
    if (!uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude are required' 
      });
    }

    // Find user by uid
    const user = await User.findOne({ where: { uid } });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get location name from coordinates
    let locationName = await geocodingService.getLocationName(latitude, longitude);
    
    // If geocoding fails, use coordinates as fallback
    if (!locationName) {
      locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    // Update user's location
    await user.update({ 
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      location: locationName
    });
    
    console.log(`📍 Location updated for user ${uid}: (${latitude}, ${longitude}) -> ${locationName}`);

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
        name: locationName
      }
    });

  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update location' 
    });
  }
};

// Get user location
const getUserLocation = async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    const user = await User.findOne({ where: { uid } });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      location: {
        lat: user.latitude ? parseFloat(user.latitude) : null,
        lon: user.longitude ? parseFloat(user.longitude) : null,
        name: user.location
      }
    });

  } catch (error) {
    console.error('Error getting user location:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user location' 
    });
  }
};

// Get a single outbreak by ID
const getOutbreakById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await outbreakAggregator.getOutbreakById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Error getting outbreak:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch outbreak' 
    });
  }
};

// Manually trigger data fetch
const triggerFetch = async (req, res) => {
  try {
    const results = await outbreakAggregator.fetchAllSources();
    
    res.json({
      success: true,
      message: 'Data fetch completed',
      results
    });
  } catch (error) {
    console.error('Error triggering fetch:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch data' 
    });
  }
};

// Get prevention guide for a disease
const getPreventionGuide = async (req, res) => {
  try {
    const { disease } = req.params;
    
    const guides = {
      'Fall Armyworm': {
        title: 'Fall Armyworm Prevention Guide',
        riskLevel: 'HIGH RISK',
        criticalSummary: 'Fall Armyworm is a destructive pest that attacks maize and other crops. Early detection is critical.',
        immediateActions: [
          'Monitor fields daily for signs of infestation',
          'Apply recommended pesticides',
          'Use pheromone traps for monitoring',
          'Practice crop rotation'
        ],
        protectiveMeasures: [
          {
            title: 'Cultural Control',
            content: 'Practice intercropping with legumes. Destroy crop residues after harvest.'
          },
          {
            title: 'Biological Control',
            content: 'Use natural enemies like parasitic wasps. Apply neem-based products.'
          },
          {
            title: 'Chemical Control',
            content: 'Rotate different pesticide classes to prevent resistance.'
          }
        ]
      },
      'Rift Valley Fever': {
        title: 'Rift Valley Fever Prevention Guide',
        riskLevel: 'HIGH RISK',
        criticalSummary: 'Rift Valley Fever is a viral disease affecting livestock and humans. Immediate vaccination is essential.',
        immediateActions: [
          'Vaccinate all susceptible livestock',
          'Implement mosquito control measures',
          'Limit animal movement',
          'Report suspected cases to authorities'
        ],
        protectiveMeasures: [
          {
            title: 'Vector Control',
            content: 'Eliminate mosquito breeding sites. Use insecticides in animal shelters.'
          },
          {
            title: 'Biosecurity',
            content: 'Quarantine new animals for 14 days. Disinfect equipment regularly.'
          },
          {
            title: 'Monitoring',
            content: 'Check animals daily for symptoms: fever, weakness, abortions.'
          }
        ]
      },
      'Maize Lethal Necrosis': {
        title: 'Maize Lethal Necrosis Prevention Guide',
        riskLevel: 'HIGH RISK',
        criticalSummary: 'MLN is a devastating viral disease of maize. There is no cure, so prevention is crucial.',
        immediateActions: [
          'Use certified disease-free seeds',
          'Control insect vectors',
          'Remove and destroy infected plants',
          'Practice crop rotation'
        ],
        protectiveMeasures: [
          {
            title: 'Resistant Varieties',
            content: 'Plant MLN-tolerant maize varieties where available.'
          },
          {
            title: 'Field Hygiene',
            content: 'Keep fields free of volunteer maize and alternative hosts.'
          },
          {
            title: 'Vector Management',
            content: 'Apply appropriate insecticides to control vectors.'
          }
        ]
      }
    };
    
    const guide = guides[disease] || {
      title: `${disease} - Prevention Guide`,
      riskLevel: 'MODERATE RISK',
      criticalSummary: `General prevention guidelines for ${disease}. Consult local agricultural extension for specific advice.`,
      immediateActions: [
        'Isolate affected plants/animals',
        'Contact agricultural extension officer',
        'Document symptoms with photos',
        'Monitor surrounding area for spread'
      ],
      protectiveMeasures: [
        {
          title: 'Isolation',
          content: 'Separate affected area to prevent spread.'
        },
        {
          title: 'Hygiene',
          content: 'Disinfect tools and equipment. Wash hands thoroughly.'
        },
        {
          title: 'Monitoring',
          content: 'Check regularly for symptoms. Report any new cases.'
        }
      ]
    };
    
    res.json({
      success: true,
      guide: {
        ...guide,
        diseaseName: disease,
        imageUrl: `https://placehold.co/600x400/FF6B6B/white?text=${encodeURIComponent(disease)}`
      }
    });
    
  } catch (error) {
    console.error('Error getting prevention guide:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch prevention guide' 
    });
  }
};

module.exports = {
  getNearbyOutbreaks,
  getOutbreakById,
  triggerFetch,
  getPreventionGuide,
  updateUserLocation,
  getUserLocation
};