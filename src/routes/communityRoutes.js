const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
  createPost,
  getPosts,
  getPostById,
  togglePostHelpful,
  addComment,
  toggleCommentHelpful,
  deletePost  // Add this
} = require('../controllers/communityController');

// Post routes
router.post('/posts', upload.single('postImage'), createPost);
router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);
router.post('/posts/:id/helpful', togglePostHelpful);
router.delete('/posts/:id', deletePost); // Add delete route

// Comment routes
router.post('/posts/:id/comments', addComment);
router.post('/posts/:postId/comments/:commentId/helpful', toggleCommentHelpful);

module.exports = router;