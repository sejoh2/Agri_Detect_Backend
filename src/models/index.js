const Post = require('./Post');
const Comment = require('./Comment');
const Helpful = require('./Helpful'); // Add this

// Post - Comment associations
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

// Post - Helpful associations
Post.hasMany(Helpful, { foreignKey: 'postId', onDelete: 'CASCADE' });
Helpful.belongsTo(Post, { foreignKey: 'postId' });

// Comment - Helpful associations
Comment.hasMany(Helpful, { foreignKey: 'commentId', onDelete: 'CASCADE' });
Helpful.belongsTo(Comment, { foreignKey: 'commentId' });

module.exports = {
  Post,
  Comment,
  Helpful // Add this
};