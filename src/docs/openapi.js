export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EV Rental API',
    version: '1.0.0',
    description: 'API documentation for EV Rental backend',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local Dev Server' }],
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'User registration',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  license: { type: 'string' },
                  address: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful',
            headers: {
              'Set-Cookie': { schema: { type: 'string' } },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' },
                            name: { type: 'string', nullable: true },
                            phone: { type: 'string', nullable: true },
                            license: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                            accountStatus: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request - missing required fields',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: {
                      type: 'string',
                      example: 'Email and password are required',
                    },
                  },
                },
              },
            },
          },
          409: {
            description: 'Conflict - email already exists',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: {
                      type: 'string',
                      example: 'Email already exists',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            headers: {
              'Set-Cookie': { schema: { type: 'string' } },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' },
                            name: { type: 'string', nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
          403: { description: 'Account not active' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'User logout',
        tags: ['Auth'],
        responses: {
          200: { description: 'Logout successful' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current user',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' },
                            name: { type: 'string', nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/vehicles': {
      get: {
        summary: 'Get all vehicles',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of vehicles',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        vehicles: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              stationId: { type: 'string' },
                              type: { type: 'string' },
                              brand: { type: 'string' },
                              model: { type: 'string' },
                              year: { type: 'integer' },
                              color: { type: 'string' },
                              seats: { type: 'integer' },
                              licensePlate: { type: 'string', nullable: true },
                              batteryLevel: { type: 'number' },
                              fuelType: { type: 'string' },
                              status: { type: 'string' },
                              softDeleted: { type: 'boolean' },
                              createdAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              updatedAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              station: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string' },
                                  location: { type: 'object' },
                                  address: { type: 'string', nullable: true },
                                  contact: { type: 'string', nullable: true },
                                  capacity: { type: 'integer' },
                                  status: { type: 'string' },
                                  softDeleted: { type: 'boolean' },
                                  createdAt: {
                                    type: 'string',
                                    format: 'date-time',
                                  },
                                  updatedAt: {
                                    type: 'string',
                                    format: 'date-time',
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
          404: { description: 'No vehicles found' },
        },
      },
      post: {
        summary: 'Create a new vehicle',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'stationId',
                  'type',
                  'brand',
                  'model',
                  'year',
                  'fuelType',
                ],
                properties: {
                  stationId: {
                    type: 'string',
                    description:
                      'ID of the station where the vehicle is located',
                  },
                  type: {
                    type: 'string',
                    enum: [
                      'SEDAN',
                      'SUV',
                      'HATCHBACK',
                      'COUPE',
                      'CONVERTIBLE',
                      'TRUCK',
                      'VAN',
                    ],
                  },
                  brand: {
                    type: 'string',
                    description: 'Vehicle brand/manufacturer',
                  },
                  model: { type: 'string', description: 'Vehicle model' },
                  year: { type: 'integer', description: 'Manufacturing year' },
                  color: { type: 'string', description: 'Vehicle color' },
                  seats: { type: 'integer', description: 'Number of seats' },
                  licensePlate: {
                    type: 'string',
                    description: 'License plate number',
                  },
                  batteryLevel: {
                    type: 'number',
                    description: 'Battery level (0-100)',
                  },
                  fuelType: {
                    type: 'string',
                    enum: ['ELECTRIC', 'HYBRID', 'GASOLINE'],
                  },
                  status: {
                    type: 'string',
                    enum: [
                      'AVAILABLE',
                      'RENTED',
                      'MAINTENANCE',
                      'RESERVED',
                      'OUT_OF_SERVICE',
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Vehicle created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Vehicle created successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        vehicle: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            stationId: { type: 'string' },
                            type: { type: 'string' },
                            brand: { type: 'string' },
                            model: { type: 'string' },
                            year: { type: 'integer' },
                            color: { type: 'string' },
                            seats: { type: 'integer' },
                            licensePlate: { type: 'string', nullable: true },
                            batteryLevel: { type: 'number' },
                            fuelType: { type: 'string' },
                            status: { type: 'string' },
                            softDeleted: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                            station: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                location: { type: 'object' },
                                address: { type: 'string', nullable: true },
                                contact: { type: 'string', nullable: true },
                                capacity: { type: 'integer' },
                                status: { type: 'string' },
                                softDeleted: { type: 'boolean' },
                                createdAt: {
                                  type: 'string',
                                  format: 'date-time',
                                },
                                updatedAt: {
                                  type: 'string',
                                  format: 'date-time',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - missing required fields' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
          404: { description: 'Station not found' },
        },
      },
    },
    '/api/vehicles/{id}': {
      get: {
        summary: 'Get vehicle by ID',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID',
          },
        ],
        responses: {
          200: {
            description: 'Vehicle details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        vehicle: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            stationId: { type: 'string' },
                            type: { type: 'string' },
                            brand: { type: 'string' },
                            model: { type: 'string' },
                            year: { type: 'integer' },
                            color: { type: 'string' },
                            seats: { type: 'integer' },
                            licensePlate: { type: 'string', nullable: true },
                            batteryLevel: { type: 'number' },
                            fuelType: { type: 'string' },
                            status: { type: 'string' },
                            softDeleted: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                            station: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                location: { type: 'object' },
                                address: { type: 'string', nullable: true },
                                contact: { type: 'string', nullable: true },
                                capacity: { type: 'integer' },
                                status: { type: 'string' },
                                softDeleted: { type: 'boolean' },
                                createdAt: {
                                  type: 'string',
                                  format: 'date-time',
                                },
                                updatedAt: {
                                  type: 'string',
                                  format: 'date-time',
                                },
                              },
                            },
                            images: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  vehicleId: { type: 'string' },
                                  imageKitFileId: { type: 'string' },
                                  url: { type: 'string' },
                                  thumbnailUrl: {
                                    type: 'string',
                                    nullable: true,
                                  },
                                  fileName: { type: 'string' },
                                  size: { type: 'integer' },
                                  fileType: { type: 'string' },
                                  uploadedAt: {
                                    type: 'string',
                                    format: 'date-time',
                                  },
                                  createdAt: {
                                    type: 'string',
                                    format: 'date-time',
                                  },
                                  updatedAt: {
                                    type: 'string',
                                    format: 'date-time',
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
          404: { description: 'Vehicle not found' },
        },
      },
      put: {
        summary: 'Update vehicle',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  stationId: {
                    type: 'string',
                    description:
                      'ID of the station where the vehicle is located',
                  },
                  type: {
                    type: 'string',
                    enum: [
                      'SEDAN',
                      'SUV',
                      'HATCHBACK',
                      'COUPE',
                      'CONVERTIBLE',
                      'TRUCK',
                      'VAN',
                    ],
                  },
                  brand: {
                    type: 'string',
                    description: 'Vehicle brand/manufacturer',
                  },
                  model: { type: 'string', description: 'Vehicle model' },
                  year: { type: 'integer', description: 'Manufacturing year' },
                  color: { type: 'string', description: 'Vehicle color' },
                  seats: { type: 'integer', description: 'Number of seats' },
                  licensePlate: {
                    type: 'string',
                    description: 'License plate number',
                  },
                  batteryLevel: {
                    type: 'number',
                    description: 'Battery level (0-100)',
                  },
                  fuelType: {
                    type: 'string',
                    enum: ['ELECTRIC', 'HYBRID', 'GASOLINE'],
                  },
                  status: {
                    type: 'string',
                    enum: [
                      'AVAILABLE',
                      'RENTED',
                      'MAINTENANCE',
                      'RESERVED',
                      'OUT_OF_SERVICE',
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Vehicle updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Vehicle updated successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        vehicle: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            stationId: { type: 'string' },
                            type: { type: 'string' },
                            brand: { type: 'string' },
                            model: { type: 'string' },
                            year: { type: 'integer' },
                            color: { type: 'string' },
                            seats: { type: 'integer' },
                            licensePlate: { type: 'string', nullable: true },
                            batteryLevel: { type: 'number' },
                            fuelType: { type: 'string' },
                            status: { type: 'string' },
                            softDeleted: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                            station: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                location: { type: 'object' },
                                address: { type: 'string', nullable: true },
                                contact: { type: 'string', nullable: true },
                                capacity: { type: 'integer' },
                                status: { type: 'string' },
                                softDeleted: { type: 'boolean' },
                                createdAt: {
                                  type: 'string',
                                  format: 'date-time',
                                },
                                updatedAt: {
                                  type: 'string',
                                  format: 'date-time',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
          404: { description: 'Vehicle or station not found' },
        },
      },
    },
    '/api/vehicles/soft-delete/{id}': {
      patch: {
        summary: 'Soft delete vehicle',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID',
          },
        ],
        responses: {
          200: {
            description: 'Vehicle soft deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Vehicle deleted successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        vehicle: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            brand: { type: 'string' },
                            model: { type: 'string' },
                            licensePlate: { type: 'string', nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - vehicle has active bookings' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
          404: { description: 'Vehicle not found' },
        },
      },
    },
    '/api/vehicles/{id}': {
      delete: {
        summary: 'Hard delete vehicle',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID',
          },
        ],
        responses: {
          200: {
            description: 'Vehicle permanently deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Vehicle permanently deleted',
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - vehicle has active bookings' },
          401: { description: 'Unauthorized' },
          403: {
            description: 'Forbidden - Insufficient permissions (Admin only)',
          },
          404: { description: 'Vehicle not found' },
        },
      },
    },
    '/api/vehicles/{vehicleId}/images': {
      post: {
        summary: 'Upload vehicle image',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'vehicleId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file to upload (JPG, PNG, WEBP)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Image uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Vehicle image uploaded successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        image: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            vehicleId: { type: 'string' },
                            imageKitFileId: { type: 'string' },
                            url: { type: 'string' },
                            thumbnailUrl: { type: 'string', nullable: true },
                            fileName: { type: 'string' },
                            size: { type: 'integer' },
                            fileType: { type: 'string' },
                            uploadedAt: { type: 'string', format: 'date-time' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - missing file or invalid format' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
          404: { description: 'Vehicle not found' },
          500: { description: 'Internal server error - upload failed' },
        },
      },
      get: {
        summary: 'Get vehicle images',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'vehicleId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID',
          },
        ],
        responses: {
          200: {
            description: 'List of vehicle images',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        images: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              vehicleId: { type: 'string' },
                              imageKitFileId: { type: 'string' },
                              url: { type: 'string' },
                              thumbnailUrl: { type: 'string', nullable: true },
                              fileName: { type: 'string' },
                              size: { type: 'integer' },
                              fileType: { type: 'string' },
                              uploadedAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              createdAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              updatedAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
          404: { description: 'Vehicle not found' },
        },
      },
    },
    '/api/vehicles/{vehicleId}/images/{imageId}': {
      delete: {
        summary: 'Delete vehicle image',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'vehicleId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID',
          },
          {
            name: 'imageId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Image ID',
          },
        ],
        responses: {
          200: {
            description: 'Image deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Vehicle image deleted successfully',
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
          404: { description: 'Vehicle or image not found' },
          500: { description: 'Internal server error - deletion failed' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
      },
    },
  },
};
