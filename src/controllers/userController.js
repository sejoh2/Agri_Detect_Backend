const User = require('../models/User');
const storageService = require('../services/storageService');
const geocodingService = require('../services/geocodingService'); // We'll create this
const fs = require('fs');

// Get user by ID, email, or uid
const getUser = async (req, res) => {
  try {
    const { id, email, uid } = req.query;
    let user;

    if (id) {
      user = await User.findByPk(id);
    } else if (email) {
      user = await User.findOne({ where: { email } });
    } else if (uid) {
      user = await User.findOne({ where: { uid } });
    } else {
      return res.status(400).json({ error: 'Either id, email, or uid is required' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      location: user.location,
      latitude: user.latitude,
      longitude: user.longitude
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create or update user (for signup)
const createOrUpdateUser = async (req, res) => {
  try {
    const { uid, name, email, phoneNumber, location, latitude, longitude } = req.body;
    const file = req.file;

    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required' });
    }

    // Check if user exists by uid
    let user = await User.findOne({ where: { uid } });

    let avatarUrl = user?.avatarUrl || null;

    // Upload new avatar if provided
    if (file) {
      if (user?.avatarUrl) {
        await storageService.deleteFile(user.avatarUrl, 'user-avatars');
      }
      avatarUrl = await storageService.uploadFile(file, 'avatars', 'user-avatars');
    }

    const userData = {
      uid,
      name: name || email.split('@')[0],
      email,
      avatarUrl,
      phoneNumber,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    };

    if (user) {
      await user.update(userData);
      console.log('✅ User updated:', user.uid);
    } else {
      user = await User.create(userData);
      console.log('✅ User created:', user.uid);
    }

    res.status(201).json({
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      location: user.location,
      latitude: user.latitude,
      longitude: user.longitude
    });

  } catch (error) {
    console.error('Error saving user:', error);
    
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ 
      error: 'Failed to save user', 
      details: error.message 
    });
  }
};

// Update user profile by uid
const updateUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, phoneNumber, location, latitude, longitude } = req.body;
    const file = req.file;

    // Find user by uid
    const user = await User.findOne({ where: { uid } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let avatarUrl = user.avatarUrl;

    // Upload new avatar if provided
    if (file) {
      if (user.avatarUrl) {
        await storageService.deleteFile(user.avatarUrl, 'user-avatars');
      }
      avatarUrl = await storageService.uploadFile(file, 'avatars', 'user-avatars');
    }

    // Update user
    await user.update({
      name: name || user.name,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phoneNumber,
      location: location !== undefined ? location : user.location,
      latitude: latitude !== undefined ? parseFloat(latitude) : user.latitude,
      longitude: longitude !== undefined ? parseFloat(longitude) : user.longitude,
      avatarUrl
    });

    console.log('✅ User updated by uid:', user.uid);

    res.json({
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      location: user.location,
      latitude: user.latitude,
      longitude: user.longitude
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ 
      error: 'Failed to update user', 
      details: error.message 
    });
  }
};

module.exports = {
  getUser,
  createOrUpdateUser,
  updateUserByUid
};