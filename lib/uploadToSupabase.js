import supabase from './supabase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} fileName - Original filename
 * @param {string} bucket - Storage bucket name (default: 'products')
 * @param {string} folder - Folder path in the bucket (default: 'images')
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadToSupabase = async (fileBuffer, fileName, bucket = 'products', folder = 'images') => {
  try {
    // Generate unique filename
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, fileBuffer, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} fileUrl - The public URL of the file to delete
 * @param {string} bucket - Storage bucket name (default: 'products')
 * @returns {Promise<void>}
 */
export const deleteFromSupabase = async (fileUrl, bucket = 'products') => {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split(`/${bucket}/`);
    if (pathParts.length < 2) {
      throw new Error('Invalid file URL');
    }
    const filePath = pathParts[1];

    // Delete file from Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Supabase Storage
 * @param {Array} files - Array of file objects from multer
 * @param {string} bucket - Storage bucket name (default: 'products')
 * @param {string} folder - Folder path in the bucket (default: 'images')
 * @returns {Promise<Array<string>>} - Array of public URLs
 */
export const uploadMultipleToSupabase = async (files, bucket = 'products', folder = 'images') => {
  const uploadPromises = files.map(file => 
    uploadToSupabase(file.buffer, file.originalname, bucket, folder)
  );
  
  return await Promise.all(uploadPromises);
};
