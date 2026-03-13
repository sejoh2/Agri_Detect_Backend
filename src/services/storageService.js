const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class StorageService {
  // Upload file to Supabase Storage
  async uploadFile(file, folder = 'posts') {
    try {
      const filePath = file.path;
      const fileName = `${folder}/${Date.now()}-${path.basename(filePath)}`;
      const fileContent = fs.readFileSync(filePath);
      
      console.log('📤 Uploading to Supabase:', fileName);
      
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('agridetect-images') // Bucket name
        .upload(fileName, fileContent, {
          contentType: file.mimetype,
          cacheControl: '3600'
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('agridetect-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('✅ File uploaded to Supabase:', publicUrl);

      // Clean up local file
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting local file:', err);
        else console.log('📁 Local file deleted:', filePath);
      });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      
      // Try to clean up local file even if upload failed
      if (file && file.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting local file:', err);
        });
      }
      
      throw error;
    }
  }

  // Delete file from Supabase
  async deleteFile(fileUrl) {
    try {
      // Extract path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/agridetect-images/posts/filename
      const urlParts = fileUrl.split('/agridetect-images/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('agridetect-images')
        .remove([filePath]);

      if (error) throw error;
      
      console.log('✅ File deleted from Supabase:', filePath);
    } catch (error) {
      console.error('Error deleting file from Supabase:', error);
    }
  }
}

module.exports = new StorageService();