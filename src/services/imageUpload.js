import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Image upload service for Supabase Storage
 * Handles image uploads with proper error handling and optimization
 */
class ImageUploadService {
  static BUCKET_NAME = 'note-images';
  static MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Upload image to Supabase Storage
   * @param {string} uri - Local image URI from ImagePicker
   * @param {string} userId - User ID for organizing uploads
   * @param {string} noteId - Optional note ID for organization
   * @returns {Promise<{url: string, error: null} | {url: null, error: string}>}
   */
  static async uploadImage(uri, userId, noteId = null) {
    try {
      console.log('📸 Starting image upload:', { uri, userId, noteId });

      // Validate inputs
      if (!uri || !userId) {
        throw new Error('URI and userId are required');
      }

      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.size > this.MAX_FILE_SIZE) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      // Generate unique filename
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = noteId 
        ? `${userId}/${noteId}/${timestamp}_${randomId}.${fileExt}`
        : `${userId}/${timestamp}_${randomId}.${fileExt}`;

      console.log('📸 Generated filename:', fileName);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      console.log('📸 Uploading to Supabase Storage...');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('📸 Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('📸 Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('📸 Public URL generated:', publicUrl);

      return {
        url: publicUrl,
        path: fileName,
        error: null
      };

    } catch (error) {
      console.error('📸 Image upload service error:', error);
      return {
        url: null,
        path: null,
        error: error.message || 'Failed to upload image'
      };
    }
  }

  /**
   * Delete image from Supabase Storage
   * @param {string} imagePath - Path of the image in storage
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  static async deleteImage(imagePath) {
    try {
      console.log('🗑️ Deleting image:', imagePath);

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([imagePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      console.log('🗑️ Image deleted successfully');
      return { success: true, error: null };

    } catch (error) {
      console.error('🗑️ Delete image error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get optimized image URL with transformations
   * @param {string} imagePath - Path of the image in storage
   * @param {Object} options - Transformation options
   * @returns {string} Optimized image URL
   */
  static getOptimizedImageUrl(imagePath, options = {}) {
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'webp'
    } = options;

    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(imagePath);

    // Note: Supabase doesn't have built-in image transformations
    // This is a placeholder for future enhancement with image CDN
    return publicUrl;
  }

  /**
   * Ensure storage bucket exists and is properly configured
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  static async ensureBucketExists() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        console.log('📦 Creating storage bucket:', this.BUCKET_NAME);
        
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }

        console.log('📦 Bucket created successfully');
      }

      return { success: true, error: null };

    } catch (error) {
      console.error('📦 Bucket setup error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ImageUploadService;