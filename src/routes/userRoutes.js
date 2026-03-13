const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
  getUser,
  createOrUpdateUser,
  updateUserByUid  // Changed import name
} = require('../controllers/userController');

// Get user by id, email, or uid (query params)
router.get('/user', getUser);

// Create or update user (for signup)
router.post('/user', upload.single('avatar'), createOrUpdateUser);

// Update user profile by uid (in URL params)
router.put('/user/uid/:uid', upload.single('avatar'), updateUserByUid);  // Changed route

module.exports = router;