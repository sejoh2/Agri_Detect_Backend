const User = require('./User');
const Post = require('./Post');
const Comment = require('./Comment');
const Helpful = require('./Helpful');
const Outbreak = require('./Outbreak'); // ADD THIS
const DataSource = require('./DataSource'); // ADD THIS

// User - Post associations
User.hasMany(Post, { foreignKey: 'userId', sourceKey: 'uid', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId', targetKey: 'uid' });

// User - Comment associations
User.hasMany(Comment, { foreignKey: 'userId', sourceKey: 'uid', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', targetKey: 'uid' });

// Post - Comment associations
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

// Post - Helpful associations
Post.hasMany(Helpful, { foreignKey: 'postId', onDelete: 'CASCADE' });
Helpful.belongsTo(Post, { foreignKey: 'postId' });

// Comment - Helpful associations
Comment.hasMany(Helpful, { foreignKey: 'commentId', onDelete: 'CASCADE' });
Helpful.belongsTo(Comment, { foreignKey: 'commentId' });

// ADD THESE EXPORTS
module.exports = {
  User,
  Post,
  Comment,
  Helpful,
  Outbreak, // ADD THIS
  DataSource // ADD THIS
};