const { Post, Comment } = require('../models/index');
const storageService = require('../services/storageService'); // Add this
const fs = require('fs');
const path = require('path');

// Helper to create file URL - REMOVE THIS FUNCTION (we won't need it anymore)
// const getFileUrl = (filename) => {
//   if (!filename) return null;
//   const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
//   return `${baseUrl}/uploads/${path.basename(filename)}`;
// };

// Create a new post
const createPost = async (req, res) => {
  try {
    const { 
      authorName, 
      authorLocation, 
      title, 
      content, 
      category,
      isExpert,
      isAnonymous
    } = req.body;
    
    const file = req.file;

    let postImageUrl = null;
    if (file) {
      // Upload to Supabase and get public URL
      postImageUrl = await storageService.uploadFile(file, 'posts');
    }

    const post = await Post.create({
      authorName: isAnonymous === 'true' ? 'Anonymous Farmer' : authorName,
      authorLocation: authorLocation || 'Unknown',
      authorImageUrl: null,
      title,
      content,
      postImageUrl,
      category: category || 'General',
      isExpert: isExpert === 'true',
      isAnonymous: isAnonymous === 'true',
      helpfulCount: 0,
      commentCount: 0
    });

    res.status(201).json({
      id: post.id,
      authorName: post.authorName,
      authorLocation: post.authorLocation,
      authorImageUrl: post.authorImageUrl,
      timeAgo: _getTimeAgo(post.createdAt),
      title: post.title,
      content: post.content,
      postImageUrl: post.postImageUrl,
      helpfulCount: post.helpfulCount,
      commentCount: post.commentCount,
      isExpert: post.isExpert,
      category: post.category,
      comments: []
    });

  } catch (error) {
    console.error('Error creating post:', error);
    
    // Clean up uploaded file if error occurred (though storageService already does this)
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ 
      error: 'Failed to create post', 
      details: error.message 
    });
  }
};

// Get all posts
const getPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0, category, expert } = req.query;
    
    const whereClause = {};
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    if (expert === 'true') {
      whereClause.isExpert = true;
    }

    const posts = await Post.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      authorName: post.authorName,
      authorLocation: post.authorLocation,
      authorImageUrl: post.authorImageUrl,
      timeAgo: _getTimeAgo(post.createdAt),
      title: post.title,
      content: post.content,
      postImageUrl: post.postImageUrl,
      helpfulCount: post.helpfulCount,
      commentCount: post.commentCount,
      isExpert: post.isExpert,
      isLikedByCurrentUser: false,
      category: post.category
    }));

    const total = await Post.count({ where: whereClause });

    res.json({
      posts: formattedPosts,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + posts.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// Get single post by ID with comments
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findByPk(id, {
      include: [{
        model: Comment,
        order: [['createdAt', 'DESC']]
      }]
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const formattedComments = post.Comments ? post.Comments.map(comment => ({
      id: comment.id,
      authorName: comment.authorName,
      authorImageUrl: comment.authorImageUrl,
      content: comment.content,
      timestamp: comment.createdAt,
      timeAgo: _getTimeAgo(comment.createdAt),
      isExpert: comment.isExpert,
      helpfulCount: comment.helpfulCount,
      isLikedByCurrentUser: false
    })) : [];

    res.json({
      id: post.id,
      authorName: post.authorName,
      authorLocation: post.authorLocation,
      authorImageUrl: post.authorImageUrl,
      timeAgo: _getTimeAgo(post.createdAt),
      title: post.title,
      content: post.content,
      postImageUrl: post.postImageUrl,
      helpfulCount: post.helpfulCount,
      commentCount: post.commentCount,
      isExpert: post.isExpert,
      isLikedByCurrentUser: false,
      category: post.category,
      comments: formattedComments
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// Toggle helpful/like on post
const togglePostHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.helpfulCount += 1;
    await post.save();

    res.json({ 
      helpfulCount: post.helpfulCount,
      message: 'Post helpful count updated' 
    });

  } catch (error) {
    console.error('Error toggling post helpful:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

// Add comment to post
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, authorName, isExpert } = req.body;
    
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.create({
      postId: post.id,
      authorName: authorName || 'Anonymous',
      content,
      isExpert: isExpert === 'true',
      helpfulCount: 0
    });

    // Update comment count on post
    post.commentCount += 1;
    await post.save();

    res.status(201).json({
      id: comment.id,
      authorName: comment.authorName,
      authorImageUrl: comment.authorImageUrl,
      content: comment.content,
      timestamp: comment.createdAt,
      timeAgo: _getTimeAgo(comment.createdAt),
      isExpert: comment.isExpert,
      helpfulCount: comment.helpfulCount,
      isLikedByCurrentUser: false
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Toggle helpful/like on comment
const toggleCommentHelpful = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.helpfulCount += 1;
    await comment.save();

    res.json({ 
      helpfulCount: comment.helpfulCount,
      message: 'Comment helpful count updated' 
    });

  } catch (error) {
    console.error('Error toggling comment helpful:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

// Helper function to format time ago
const _getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

// Optional: Delete post with image
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Delete image from Supabase if exists
    if (post.postImageUrl) {
      await storageService.deleteFile(post.postImageUrl);
    }

    await post.destroy();

    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  togglePostHelpful,
  addComment,
  toggleCommentHelpful,
  deletePost // Export if you want to add delete route
};