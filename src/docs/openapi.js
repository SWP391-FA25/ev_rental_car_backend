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
    '/api/stations': {
      get: {
        summary: 'Get all active stations',
        tags: ['Stations'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of stations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        stations: {
                          type: 'array',
                          items: {
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
                              vehicles: {
                                type: 'array',
                                items: { type: 'object' },
                              },
                              stationStaff: {
                                type: 'array',
                                items: { type: 'object' },
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
          404: { description: 'No stations found' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new station',
        tags: ['Stations'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'location', 'address', 'status', 'capacity'],
                properties: {
                  name: { type: 'string' },
                  location: { type: 'object' },
                  address: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
                  },
                  capacity: { type: 'integer' },
                  contact: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Station created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        station: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            location: { type: 'object' },
                            address: { type: 'string' },
                            status: { type: 'string' },
                            capacity: { type: 'integer' },
                            contact: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
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
          409: { description: 'Station name already exists' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/stations/unavailable': {
      get: {
        summary: 'Get unavailable stations (soft deleted or inactive)',
        tags: ['Stations'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of unavailable stations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        deletedStations: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              location: { type: 'object' },
                              address: { type: 'string', nullable: true },
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
          404: { description: 'No unavailable stations found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/stations/{id}': {
      get: {
        summary: 'Get station by ID',
        tags: ['Stations'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Station ID',
          },
        ],
        responses: {
          200: {
            description: 'Station details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
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
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                            vehicles: {
                              type: 'array',
                              items: { type: 'object' },
                            },
                            stationStaff: {
                              type: 'array',
                              items: { type: 'object' },
                            },
                            bookings: {
                              type: 'array',
                              items: { type: 'object' },
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
          404: { description: 'Station not found' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update station',
        tags: ['Stations'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Station ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'location', 'address', 'status', 'capacity'],
                properties: {
                  name: { type: 'string' },
                  location: { type: 'object' },
                  address: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
                  },
                  capacity: { type: 'integer' },
                  contact: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Station updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        station: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            location: { type: 'object' },
                            address: { type: 'string' },
                            status: { type: 'string' },
                            capacity: { type: 'integer' },
                            contact: { type: 'string' },
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
          400: { description: 'Bad request' },
          404: { description: 'Station not found' },
          409: { description: 'Station name already exists' },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Hard delete station',
        tags: ['Stations'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Station ID',
          },
        ],
        responses: {
          200: {
            description: 'Station deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Station deleted successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        station: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Station not found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/stations/soft-delete/{id}': {
      patch: {
        summary: 'Soft delete station',
        tags: ['Stations'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Station ID',
          },
        ],
        responses: {
          200: {
            description: 'Station soft deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        station: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            location: { type: 'object' },
                            address: { type: 'string' },
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
            description:
              'Cannot delete: Station has active vehicles or bookings',
          },
          404: { description: 'Station not found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/staff': {
      get: {
        summary: 'Get all staff and admin users',
        tags: ['Staff'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of staff and admin users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        staff: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              email: { type: 'string' },
                              name: { type: 'string', nullable: true },
                              phone: { type: 'string', nullable: true },
                              address: { type: 'string', nullable: true },
                              role: { type: 'string' },
                              accountStatus: { type: 'string' },
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
          404: { description: 'No staff or admin found' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new staff or admin user',
        tags: ['Staff'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  accountStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
                    default: 'ACTIVE',
                  },
                  role: {
                    type: 'string',
                    enum: ['STAFF', 'ADMIN'],
                    default: 'STAFF',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Staff created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        staff: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            name: { type: 'string' },
                            phone: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                            role: { type: 'string' },
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
          400: { description: 'Bad request - validation errors' },
          409: { description: 'Email already exists' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/staff/{id}': {
      get: {
        summary: 'Get staff or admin by ID',
        tags: ['Staff'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff ID',
          },
        ],
        responses: {
          200: {
            description: 'Staff details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        staff: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            name: { type: 'string', nullable: true },
                            phone: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                            role: { type: 'string' },
                            accountStatus: { type: 'string' },
                            softDeleted: { type: 'boolean' },
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
          404: { description: 'Staff or admin not found' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update staff or admin',
        tags: ['Staff'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  accountStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
                  },
                  role: {
                    type: 'string',
                    enum: ['STAFF', 'ADMIN'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Staff updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        staff: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            name: { type: 'string' },
                            phone: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                            role: { type: 'string' },
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
          400: { description: 'Bad request - validation errors' },
          404: { description: 'Staff or admin not found' },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Hard delete staff or admin',
        tags: ['Staff'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff ID',
          },
        ],
        responses: {
          200: {
            description: 'Staff/admin deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Staff/admin deleted successfully',
                    },
                  },
                },
              },
            },
          },
          400: { description: 'This is not a staff or admin account' },
          404: { description: 'Staff or admin not found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/staff/soft-delete/{id}': {
      patch: {
        summary: 'Soft delete staff or admin',
        tags: ['Staff'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['SUSPENDED', 'BANNED'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Staff/admin soft deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Staff/admin soft deleted',
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid status' },
          404: { description: 'Staff or admin not found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/renters': {
      get: {
        summary: 'Get all renters',
        tags: ['Renters'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of renters',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        renters: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              email: { type: 'string' },
                              name: { type: 'string', nullable: true },
                              phone: { type: 'string', nullable: true },
                              address: { type: 'string', nullable: true },
                              role: { type: 'string' },
                              accountStatus: { type: 'string' },
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
          404: { description: 'No renters found' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new renter',
        tags: ['Renters'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  accountStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
                    default: 'ACTIVE',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Renter created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        renter: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            name: { type: 'string' },
                            phone: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                            role: { type: 'string' },
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
          400: { description: 'Bad request - validation errors' },
          409: { description: 'Email already exists' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/renters/{id}': {
      get: {
        summary: 'Get renter by ID',
        tags: ['Renters'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Renter ID',
          },
        ],
        responses: {
          200: {
            description: 'Renter details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        renter: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            name: { type: 'string', nullable: true },
                            phone: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                            role: { type: 'string' },
                            accountStatus: { type: 'string' },
                            softDeleted: { type: 'boolean' },
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
          404: { description: 'Renter not found' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update renter',
        tags: ['Renters'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Renter ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  accountStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Renter updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        renter: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            name: { type: 'string' },
                            phone: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                            role: { type: 'string' },
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
          400: { description: 'Bad request - validation errors' },
          404: { description: 'Renter not found' },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Hard delete renter',
        tags: ['Renters'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Renter ID',
          },
        ],
        responses: {
          200: {
            description: 'Renter deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Renter deleted successfully',
                    },
                  },
                },
              },
            },
          },
          400: { description: 'This is not a renter account' },
          404: { description: 'Renter not found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/renters/soft-delete/{id}': {
      patch: {
        summary: 'Soft delete renter',
        tags: ['Renters'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Renter ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['SUSPENDED', 'BANNED'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Renter soft deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Renter soft deleted' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid status' },
          404: { description: 'Renter not found' },
          401: { description: 'Unauthorized' },
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
