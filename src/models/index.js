const Post = require('./Post');
const Comment = require('./Comment');

// Post - Comment associations
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

module.exports = {
  Post,
  Comment
};