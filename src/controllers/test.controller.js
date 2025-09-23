import ImageKitService from '../lib/imagekit.js';

class TestController {
  // Test ImageKit connection
  async testImageKitConnection(req, res) {
    try {
      // Test with a simple buffer (1x1 pixel PNG)
      const testBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHI3BMX2QAAAA==',
        'base64'
      );

      const result = await ImageKitService.uploadFile(
        testBuffer,
        'test-image.png',
        'test',
        {
          tags: ['test'],
        }
      );

      if (result.success) {
        // Clean up test file
        if (result.data.fileId) {
          await ImageKitService.deleteFile(result.data.fileId);
        }

        res.json({
          success: true,
          message: 'ImageKit connection successful',
          data: {
            canUpload: true,
            canDelete: true,
            endpoint: process.env.IMAGEKIT_URL_ENDPOINT,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'ImageKit connection failed',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('ImageKit test error:', error);
      res.status(500).json({
        success: false,
        message: 'ImageKit test failed',
        error: error.message,
      });
    }
  }

  // Test image transformations
  async testImageTransformations(req, res) {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an ImageKit URL in the query parameter',
        });
      }

      const transformations = {
        thumbnail: ImageKitService.getThumbnailUrl(url, 150),
        medium: ImageKitService.getOptimizedUrl(url, {
          width: 400,
          height: 400,
        }),
        highQuality: ImageKitService.getOptimizedUrl(url, {
          quality: 90,
          format: 'jpg',
        }),
        lowQuality: ImageKitService.getOptimizedUrl(url, {
          quality: 30,
          format: 'webp',
        }),
      };

      res.json({
        success: true,
        message: 'Image transformations generated',
        data: {
          original: url,
          transformations,
        },
      });
    } catch (error) {
      console.error('Transformation test error:', error);
      res.status(500).json({
        success: false,
        message: 'Transformation test failed',
        error: error.message,
      });
    }
  }
}

export default new TestController();
