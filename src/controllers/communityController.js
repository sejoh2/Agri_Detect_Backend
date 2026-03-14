const { Post, Comment, Helpful, User } = require('../models/index');
const storageService = require('../services/storageService');
const fs = require('fs');
const path = require('path');

// Create a new post
// Create a new post
const createPost = async (req, res) => {
  try {
    const { 
      userId,
      title, 
      content, 
      category,
      isAnonymous
    } = req.body;
    
    const file = req.file;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Verify user exists in Users table
    const user = await User.findOne({ where: { uid: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let postImageUrl = null;
    if (file) {
      postImageUrl = await storageService.uploadFile(file, 'posts');
    }

    const post = await Post.create({
      userId,
      title,
      content,
      postImageUrl,
      category: category || 'General',
      isAnonymous: isAnonymous === 'true',
      helpfulCount: 0,
      commentCount: 0
    });

    // Fetch the created post with user data
    const createdPost = await Post.findByPk(post.id, {
      include: [{
        model: User,
        attributes: ['name', 'location', 'avatarUrl', 'isExpert']
      }]
    });

    res.status(201).json({
      id: createdPost.id,
      userId: createdPost.userId,
      authorName: createdPost.User?.name || 'Anonymous',
      authorLocation: createdPost.User?.location || 'Unknown',
      authorImageUrl: createdPost.User?.avatarUrl,
      isExpert: createdPost.User?.isExpert || false,
      timeAgo: _getTimeAgo(createdPost.createdAt),
      title: createdPost.title,
      content: createdPost.content,
      postImageUrl: createdPost.postImageUrl,
      helpfulCount: createdPost.helpfulCount,
      commentCount: createdPost.commentCount,
      isExpert: createdPost.isExpert,
      category: createdPost.category,
      isAnonymous: createdPost.isAnonymous,
      comments: []
    });

  } catch (error) {
    console.error('Error creating post:', error);
    
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
// Get all posts with user's helpful status
const getPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0, category, expert, currentUserId } = req.query;
    
    const whereClause = {};
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    const posts = await Post.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: User,
        attributes: ['name', 'location', 'avatarUrl', 'isExpert'], // Join with Users table
        required: true // Inner join - only posts from existing users
      }]
    });

    // Get helpful status for each post if currentUserId is provided
    const formattedPosts = await Promise.all(posts.map(async (post) => {
      let isLikedByCurrentUser = false;
      
      if (currentUserId) {
        const helpful = await Helpful.findOne({
          where: {
            userId: currentUserId,
            postId: post.id,
            type: 'post'
          }
        });
        isLikedByCurrentUser = !!helpful;
      }

      return {
        id: post.id,
        userId: post.userId,
        authorName: post.User.name, // From Users table
        authorLocation: post.User.location || 'Unknown',
        authorImageUrl: post.User.avatarUrl, // From Users table
        isExpert: post.User.isExpert, // From Users table
        timeAgo: _getTimeAgo(post.createdAt),
        title: post.title,
        content: post.content,
        postImageUrl: post.postImageUrl,
        helpfulCount: post.helpfulCount,
        commentCount: post.commentCount,
        isLikedByCurrentUser: isLikedByCurrentUser,
        category: post.category,
        isAnonymous: post.isAnonymous
      };
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

// Get single post by ID with comments and helpful status
// Get single post by ID with comments
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query;
    
    const post = await Post.findByPk(id, {
      include: [
        { 
          model: User,
          attributes: ['name', 'location', 'avatarUrl', 'isExpert']
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['name', 'avatarUrl', 'isExpert']
          }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get helpful status for post
    let isPostLikedByCurrentUser = false;
    if (currentUserId) {
      const postHelpful = await Helpful.findOne({
        where: {
          userId: currentUserId,
          postId: post.id,
          type: 'post'
        }
      });
      isPostLikedByCurrentUser = !!postHelpful;
    }

    // Get helpful status for each comment
    const formattedComments = await Promise.all((post.Comments || []).map(async (comment) => {
      let isCommentLikedByCurrentUser = false;
      
      if (currentUserId) {
        const commentHelpful = await Helpful.findOne({
          where: {
            userId: currentUserId,
            commentId: comment.id,
            type: 'comment'
          }
        });
        isCommentLikedByCurrentUser = !!commentHelpful;
      }

      return {
        id: comment.id,
        userId: comment.userId,
        authorName: comment.User?.name || 'Anonymous',
        authorImageUrl: comment.User?.avatarUrl,
        isExpert: comment.User?.isExpert || false,
        content: comment.content,
        timestamp: comment.createdAt,
        timeAgo: _getTimeAgo(comment.createdAt),
        helpfulCount: comment.helpfulCount,
        isLikedByCurrentUser: isCommentLikedByCurrentUser
      };
    }));

    res.json({
      id: post.id,
      userId: post.userId,
      authorName: post.User?.name || 'Anonymous',
      authorLocation: post.User?.location || 'Unknown',
      authorImageUrl: post.User?.avatarUrl,
      isExpert: post.User?.isExpert || false,
      timeAgo: _getTimeAgo(post.createdAt),
      title: post.title,
      content: post.content,
      postImageUrl: post.postImageUrl,
      helpfulCount: post.helpfulCount,
      commentCount: post.commentCount,
      isLikedByCurrentUser: isPostLikedByCurrentUser,
      category: post.category,
      isAnonymous: post.isAnonymous,
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
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already liked this post
    const existingHelpful = await Helpful.findOne({
      where: {
        userId,
        postId: id,
        type: 'post'
      }
    });

    if (existingHelpful) {
      // Unlike: remove helpful record and decrement count
      await existingHelpful.destroy();
      post.helpfulCount -= 1;
      await post.save();
      
      res.json({ 
        helpfulCount: post.helpfulCount,
        isLiked: false,
        message: 'Post unliked' 
      });
    } else {
      // Like: create helpful record and increment count
      await Helpful.create({
        userId,
        postId: id,
        type: 'post'
      });
      
      post.helpfulCount += 1;
      await post.save();

      res.json({ 
        helpfulCount: post.helpfulCount,
        isLiked: true,
        message: 'Post liked' 
      });
    }

  } catch (error) {
    console.error('Error toggling post helpful:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

// Add comment to post
// Add comment to post
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Verify user exists
    const user = await User.findOne({ where: { uid: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.create({
      userId,
      postId: post.id,
      content,
      helpfulCount: 0
    });

    // Update comment count on post
    post.commentCount += 1;
    await post.save();

    // Fetch created comment with user data
    const createdComment = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        attributes: ['name', 'avatarUrl', 'isExpert']
      }]
    });

    res.status(201).json({
      id: createdComment.id,
      userId: createdComment.userId,
      authorName: createdComment.User?.name || 'Anonymous',
      authorImageUrl: createdComment.User?.avatarUrl,
      isExpert: createdComment.User?.isExpert || false,
      content: createdComment.content,
      timestamp: createdComment.createdAt,
      timeAgo: _getTimeAgo(createdComment.createdAt),
      helpfulCount: createdComment.helpfulCount,
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
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user already liked this comment
    const existingHelpful = await Helpful.findOne({
      where: {
        userId,
        commentId,
        type: 'comment'
      }
    });

    if (existingHelpful) {
      // Unlike: remove helpful record and decrement count
      await existingHelpful.destroy();
      comment.helpfulCount -= 1;
      await comment.save();
      
      res.json({ 
        helpfulCount: comment.helpfulCount,
        isLiked: false,
        message: 'Comment unliked' 
      });
    } else {
      // Like: create helpful record and increment count
      await Helpful.create({
        userId,
        commentId,
        type: 'comment'
      });
      
      comment.helpfulCount += 1;
      await comment.save();

      res.json({ 
        helpfulCount: comment.helpfulCount,
        isLiked: true,
        message: 'Comment liked' 
      });
    }

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

// Delete post with image
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

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
  deletePost
};