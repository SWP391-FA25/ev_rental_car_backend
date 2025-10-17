import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function saveFileToLocal(
  fileBuffer,
  originalName,
  folder,
  prefix = ''
) {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', folder);
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // Generate unique filename
  const filename = `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(originalName)}`;
  const filePath = path.join(uploadDir, filename);

  // Save file
  await fs.writeFile(filePath, fileBuffer);

  // Return URL path
  return `/uploads/${folder}/${filename}`;
}

export async function deleteFileFromLocal(fileUrl) {
  try {
    // Convert URL path to filesystem path
    const filePath = path.join(__dirname, '..', '..', ...fileUrl.split('/'));
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error as this shouldn't break the main flow
  }
}

/**
 * Save file using configured storage method (ImageKit or local)
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} folder - Folder to save the file in
 * @param {string} prefix - Prefix for the filename (optional)
 * @param {Object} metadata - Additional metadata for ImageKit
 * @returns {Promise<Object>} - Result with URL and storage details
 */
export async function saveFile(fileBuffer, originalName, folder, prefix = '', metadata = {}) {
  // Check if ImageKit is configured
  const useImageKit = process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT;
  
  if (useImageKit) {
    // Use ImageKit for storage
    try {
      const imageKitService = (await import('../lib/imagekit.js')).default;
      const fileName = `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(originalName)}`;
      const imageKitFolder = `${folder}`;
      
      const result = await imageKitService.uploadFile(fileBuffer, fileName, imageKitFolder, {
        tags: [folder, ...Object.values(metadata)],
      });
      
      if (result.success) {
        return {
          success: true,
          url: result.data.url,
          storageType: 'imagekit',
          fileId: result.data.fileId,
          thumbnailUrl: result.data.thumbnailUrl,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('ImageKit upload failed, falling back to local storage:', error);
      // Fall back to local storage if ImageKit fails
    }
  }
  
  // Use local storage as fallback or default
  try {
    const url = await saveFileToLocal(fileBuffer, originalName, folder, prefix);
    return {
      success: true,
      url: url,
      storageType: 'local',
    };
  } catch (error) {
    console.error('Local file storage failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}