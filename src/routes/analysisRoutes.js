const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
  analyzePlantHealth, 
  getRecentAnalyses, 
  getAnalysisById,
  deleteAnalysis 
} = require('../controllers/analysisController');

// Analyze plant health endpoint
// Accepts: 
// - file upload (image/audio) via multipart/form-data with field name 'file'
// - text input via JSON { "text": "description" }
router.post('/analyze', upload.single('file'), analyzePlantHealth);

// Get recent analyses (public)
router.get('/recent', getRecentAnalyses);

// Get single analysis by ID (public)
router.get('/:id', getAnalysisById);

// Delete analysis (optional)
router.delete('/:id', deleteAnalysis);

module.exports = router;