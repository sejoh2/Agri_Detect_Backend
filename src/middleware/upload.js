const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter - allow images and audio
const fileFilter = (req, file, cb) => {
  // Log the actual MIME type for debugging
  console.log('📁 Upload - MIME type:', file.mimetype);
  console.log('📁 Upload - Original name:', file.originalname);
  console.log('📁 Upload - Field name:', file.fieldname);

  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  // EXPANDED: Add all possible audio MIME types
  const allowedAudioTypes = [
    'audio/mpeg', 'audio/mp3', 
    'audio/wav', 'audio/x-wav',
    'audio/m4a', 'audio/x-m4a', 
    'audio/mp4', 'audio/x-mp4',
    'audio/aac', 'audio/aacp',
    'audio/ogg', 'audio/webm',
    'audio/3gpp', 'audio/3gpp2',
    'audio/amr', 'audio/x-amr'
  ];
  
  const allowedTypes = [...allowedImageTypes, ...allowedAudioTypes];

  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ File type accepted:', file.mimetype);
    cb(null, true);
  } else {
    console.log('❌ File type rejected:', file.mimetype);
    cb(new Error('Invalid file type. Only images and audio files are allowed.'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;