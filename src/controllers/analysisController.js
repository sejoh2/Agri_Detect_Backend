const Analysis = require('../models/Analysis');
const geminiService = require('../services/geminiService');
const fs = require('fs');
const path = require('path');

// Helper to determine input type from file
const determineInputType = (file) => {
  if (!file) return 'text';
  
  const mimeType = file.mimetype;
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'text';
};

// Helper to create file URL
const getFileUrl = (filename) => {
  if (!filename) return null;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${path.basename(filename)}`;
};

// Analyze plant health
const analyzePlantHealth = async (req, res) => {
  try {
    const { text } = req.body;
    const file = req.file;
    
    // Determine input type
    const inputType = determineInputType(file);
    
    let analysisResult;
    let imageUrl = null;
    let audioFileUrl = null;
    let textInput = null;

    console.log(`Processing ${inputType} analysis...`);

    // Process based on input type
    switch (inputType) {
      case 'image':
        if (!file) {
          return res.status(400).json({ error: 'Image file is required' });
        }
        
        // Read image file
        const imageBuffer = fs.readFileSync(file.path);
        analysisResult = await geminiService.analyzeImage(imageBuffer, file.mimetype);
        imageUrl = getFileUrl(file.filename);
        break;

      case 'audio':
        if (!file) {
          return res.status(400).json({ error: 'Audio file is required' });
        }
        
        // Read audio file
        const audioBuffer = fs.readFileSync(file.path);
        analysisResult = await geminiService.analyzeAudio(audioBuffer, file.mimetype);
        audioFileUrl = getFileUrl(file.filename);
        break;

      case 'text':
        if (!text) {
          return res.status(400).json({ error: 'Text description is required' });
        }
        
        analysisResult = await geminiService.analyzeText(text);
        textInput = text;
        break;
    }

    // Create analysis record in database
    const analysis = await Analysis.create({
      inputType,
      imageUrl,
      audioFileUrl,
      textInput,
      status: analysisResult.status || 'ANALYSIS COMPLETE',
      progress: analysisResult.progress || 100,
      result: analysisResult,
      diseaseName: analysisResult.alert?.diseaseName,
      severity: analysisResult.alert?.severity
    });

    console.log(`Analysis saved with ID: ${analysis.id}`);

    // Clean up uploaded file after processing (optional - keep if you want to store files)
    if (file) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    // Return response in the format expected by frontend
    res.status(201).json({
      id: analysis.id,
      inputType: analysis.inputType,
      imageUrl: analysis.imageUrl,
      audioFile: analysis.audioFileUrl,
      textInput: analysis.textInput,
      status: analysis.status,
      progress: analysis.progress,
      checklist: analysis.result.checklist,
      alert: analysis.result.alert,
      treatmentPlan: analysis.result.treatmentPlan,
      createdAt: analysis.createdAt
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Clean up uploaded file if error occurred
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Get recent analyses (public)
const getRecentAnalyses = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const analyses = await Analysis.findAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id', 'inputType', 'imageUrl', 'status', 'diseaseName', 'severity', 'createdAt']
    });

    const total = await Analysis.count();

    res.json({
      analyses,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + analyses.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
};

// Get single analysis by ID (public)
const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const analysis = await Analysis.findByPk(id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Format response to match frontend structure
    res.json({
      id: analysis.id,
      inputType: analysis.inputType,
      imageUrl: analysis.imageUrl,
      audioFile: analysis.audioFileUrl,
      textInput: analysis.textInput,
      status: analysis.status,
      progress: analysis.progress,
      checklist: analysis.result?.checklist || [],
      alert: analysis.result?.alert || {
        title: 'INFO',
        diseaseName: 'No disease detected',
        description: 'The plant appears healthy based on the analysis.',
        severity: 'info'
      },
      treatmentPlan: analysis.result?.treatmentPlan || {
        steps: []
      },
      createdAt: analysis.createdAt
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
};

// Delete analysis (optional)
const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    
    const analysis = await Analysis.findByPk(id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Delete associated files if they exist
    if (analysis.imageUrl) {
      const imagePath = path.join(__dirname, '../../uploads', path.basename(analysis.imageUrl));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (analysis.audioFileUrl) {
      const audioPath = path.join(__dirname, '../../uploads', path.basename(analysis.audioFileUrl));
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }

    await analysis.destroy();

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
};

module.exports = {
  analyzePlantHealth,
  getRecentAnalyses,
  getAnalysisById,
  deleteAnalysis
};