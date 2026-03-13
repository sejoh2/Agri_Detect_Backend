const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully');
    
    // Import models to register them with Sequelize
    const User = require('../models/User');
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Analysis = require('../models/Analysis');
    
    // Define associations
    Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
    Comment.belongsTo(Post, { foreignKey: 'postId' });
    
    // Note: User model doesn't have associations yet, but can be added later
    
    console.log('✅ Models registered:', {
      User: !!User,
      Post: !!Post,
      Comment: !!Comment,
      Analysis: !!Analysis
    });
    
    // Sync models in development (creates tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced - All tables created/updated');
      
      // List all tables
      const [results] = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
      );
      const tables = results.map(r => r.table_name).join(', ');
      console.log('📊 Tables in database:', tables);
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };