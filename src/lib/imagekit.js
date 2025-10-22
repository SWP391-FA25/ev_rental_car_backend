import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

// Initialize ImageKit instance
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

class ImageKitService {
  /**
   * Upload file to ImageKit
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} folder - Folder path in ImageKit
   * @param {Object} options - Additional upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(fileBuffer, fileName, folder = 'documents', options = {}) {
    try {
      const uploadParams = {
        file: fileBuffer,
        fileName: fileName,
        folder: folder,
        useUniqueFileName: true,
        ...options,
      };

      // Remove custom metadata to avoid validation issues
      if (uploadParams.customMetadata) {
        delete uploadParams.customMetadata;
      }

      const uploadResult = await imagekit.upload(uploadParams);

      return {
        success: true,
        data: {
          fileId: uploadResult.fileId,
          name: uploadResult.name,
          filePath: uploadResult.filePath,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          size: uploadResult.size,
          fileType: uploadResult.fileType,
        },
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete file from ImageKit
   * @param {string} fileId - ImageKit file ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(fileId) {
    try {
      await imagekit.deleteFile(fileId);
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('ImageKit delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get file details from ImageKit
   * @param {string} fileId - ImageKit file ID
   * @returns {Promise<Object>} File details
   */
  async getFileDetails(fileId) {
    try {
      const fileDetails = await imagekit.getFileDetails(fileId);
      return {
        success: true,
        data: fileDetails,
      };
    } catch (error) {
      console.error('ImageKit get file details error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate optimized URL with transformations
   * @param {string} url - Original ImageKit URL
   * @param {Object} transformations - Transformation parameters
   * @returns {string} Transformed URL
   */
  getOptimizedUrl(url, transformations = {}) {
    try {
      const optimizedUrl = imagekit.url({
        src: url,
        transformation: [
          {
            height: transformations.height || 400,
            width: transformations.width || 400,
            crop: transformations.crop || 'maintain_ratio',
            quality: transformations.quality || 80,
            format: transformations.format || 'auto',
            ...transformations,
          },
        ],
      });

      return optimizedUrl;
    } catch (error) {
      console.error('ImageKit URL generation error:', error);
      return url; // Return original URL if transformation fails
    }
  }

  /**
   * Generate thumbnail URL
   * @param {string} url - Original ImageKit URL
   * @param {number} size - Thumbnail size (default: 150)
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(url, size = 150) {
    return this.getOptimizedUrl(url, {
      height: size,
      width: size,
      crop: 'maintain_ratio',
      quality: 70,
    });
  }

  /**
   * Upload document with specific folder structure
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} userId - User ID
   * @param {string} documentType - Document type
   * @returns {Promise<Object>} Upload result
   */
  async uploadDocument(fileBuffer, fileName, userId, documentType) {
    const folder = `documents/${userId}/${documentType.toLowerCase()}`;

    return await this.uploadFile(fileBuffer, fileName, folder, {
      tags: [documentType, userId, 'document'],
      customMetadata: {
        userId: userId,
        documentType: documentType,
        uploadDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Upload vehicle image
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Upload result
   */
  async uploadVehicleImage(fileBuffer, fileName, vehicleId) {
    const folder = `vehicles/${vehicleId}`;

    return await this.uploadFile(fileBuffer, fileName, folder, {
      tags: ['vehicle', vehicleId, 'image'],
      customMetadata: {
        vehicleId: vehicleId,
        uploadDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Upload contract document
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} Upload result
   */
  async uploadContract(fileBuffer, fileName, contractId) {
    const folder = `contracts/${new Date().getFullYear()}`;

    return await this.uploadFile(fileBuffer, fileName, folder, {
      tags: ['contract', contractId, 'signed'],
      customMetadata: {
        contractId: contractId,
        uploadDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Upload inspection image
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} inspectionId - Inspection ID
   * @returns {Promise<Object>} Upload result
   */
  async uploadInspectionImage(fileBuffer, fileName, inspectionId) {
    const folder = `inspections/${inspectionId}`;

    return await this.uploadFile(fileBuffer, fileName, folder, {
      tags: ['inspection', inspectionId, 'image'],
      customMetadata: {
        inspectionId: inspectionId,
        uploadDate: new Date().toISOString(),
      },
    });
  }
}

export default new ImageKitService();