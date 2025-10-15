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
    '/api/email/send-verification': {
      post: {
        summary: 'Send email verification',
        tags: ['Email'],
        security: [{ cookieAuth: [] }],
        description: 'Send a verification email to the authenticated user',
        responses: {
          200: {
            description: 'Verification email sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Verification email sent',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request - User not found or missing email',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User not found' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized - User not authenticated' },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Error sending email' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/email/verify/{token}': {
      get: {
        summary: 'Verify email with token',
        tags: ['Email'],
        description: 'Verify user email address using verification token',
        parameters: [
          {
            name: 'token',
            in: 'path',
            required: true,
            description: 'Email verification token',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'Email verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Email verified successfully',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request - Invalid token or user not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Invalid token',
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Internal server error',
                    },
                  },
                },
              },
            },
          },
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
    // Assign endpoints
    '/api/assign': {
      post: {
        summary: 'Create a new assignment',
        tags: ['Assignments'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['stationId', 'staffId'],
                properties: {
                  stationId: {
                    type: 'string',
                    description: 'ID of the station',
                  },
                  staffId: {
                    type: 'string',
                    description: 'ID of the staff member',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Assignment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Assignment created' },
                    assignment: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        station: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                          },
                        },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
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
          404: { description: 'Station or Staff not found' },
          409: { description: 'Assignment already exists' },
        },
      },
      get: {
        summary: 'Get all assignments',
        tags: ['Assignments'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of assignments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assignments: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          stationId: { type: 'string' },
                          userId: { type: 'string' },
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
          404: { description: 'No assignments found' },
        },
      },
    },
    '/api/assign/{id}': {
      get: {
        summary: 'Get assignment by ID',
        tags: ['Assignments'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          },
        ],
        responses: {
          200: {
            description: 'Assignment details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assignment: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        stationId: { type: 'string' },
                        userId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Assignment not found' },
        },
      },
      put: {
        summary: 'Update assignment by ID',
        tags: ['Assignments'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
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
                    description: 'ID of the station',
                  },
                  staffId: {
                    type: 'string',
                    description: 'ID of the staff member',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Assignment updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Assignment updated' },
                    updated: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        stationId: { type: 'string' },
                        userId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Assignment not found' },
        },
      },
      delete: {
        summary: 'Delete assignment by ID',
        tags: ['Assignments'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Assignment ID',
          },
        ],
        responses: {
          200: {
            description: 'Assignment deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        stationId: { type: 'string' },
                        userId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                    message: { type: 'string', example: 'Assignment deleted' },
                  },
                },
              },
            },
          },
          404: { description: 'Assignment not found' },
        },
      },
    },
    // Booking endpoints
    '/api/bookings': {
      get: {
        summary: 'Get all bookings with filters',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'PENDING',
                'CONFIRMED',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED',
              ],
            },
            description: 'Filter by booking status',
          },
          {
            name: 'userId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by user ID',
          },
          {
            name: 'vehicleId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by vehicle ID',
          },
          {
            name: 'stationId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by station ID',
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Filter bookings from this date',
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Filter bookings until this date',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number for pagination',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Number of items per page',
          },
        ],
        responses: {
          200: {
            description: 'Bookings retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        bookings: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/BookingWithRelations',
                          },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            currentPage: { type: 'integer' },
                            totalPages: { type: 'integer' },
                            totalItems: { type: 'integer' },
                            itemsPerPage: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - invalid query parameters' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - insufficient permissions' },
        },
      },
      post: {
        summary: 'Create a new booking',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'vehicleId',
                  'stationId',
                  'startTime',
                  'pickupLocation',
                ],
                properties: {
                  vehicleId: {
                    type: 'string',
                    description: 'ID of the vehicle to book',
                  },
                  stationId: {
                    type: 'string',
                    description: 'ID of the station',
                  },
                  startTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Booking start time',
                  },
                  endTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Booking end time (optional)',
                  },
                  pickupLocation: {
                    type: 'string',
                    description: 'Pickup location',
                  },
                  dropoffLocation: {
                    type: 'string',
                    description: 'Dropoff location (optional)',
                  },
                  promotions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of promotion codes or IDs',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Booking created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Booking created successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        booking: {
                          $ref: '#/components/schemas/BookingWithRelations',
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
              'Bad request - missing required fields or invalid time range',
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Vehicle, station, or user not found' },
          409: {
            description: 'Vehicle not available for booking',
          },
        },
      },
    },
    '/api/bookings/analytics': {
      get: {
        summary: 'Get booking analytics',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Analytics start date filter',
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Analytics end date filter',
          },
        ],
        responses: {
          200: {
            description: 'Analytics data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalBookings: { type: 'integer' },
                            totalRevenue: { type: 'number' },
                            averageBookingValue: { type: 'number' },
                          },
                        },
                        statusBreakdown: {
                          type: 'object',
                          additionalProperties: { type: 'integer' },
                        },
                        popularVehicles: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              vehicleId: { type: 'string' },
                              bookingCount: { type: 'integer' },
                            },
                          },
                        },
                        popularStations: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              stationId: { type: 'string' },
                              bookingCount: { type: 'integer' },
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
          400: { description: 'Bad request - invalid date parameters' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - admin/staff only' },
        },
      },
    },
    '/api/bookings/user/{userId}': {
      get: {
        summary: 'Get user bookings',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'PENDING',
                'CONFIRMED',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED',
              ],
            },
            description: 'Filter by booking status',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number for pagination',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Number of items per page',
          },
        ],
        responses: {
          200: {
            description: 'User bookings retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        bookings: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/BookingWithRelations',
                          },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            currentPage: { type: 'integer' },
                            totalPages: { type: 'integer' },
                            totalItems: { type: 'integer' },
                            itemsPerPage: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - invalid user ID or parameters' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/bookings/{id}': {
      get: {
        summary: 'Get booking by ID',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Booking ID',
          },
        ],
        responses: {
          200: {
            description: 'Booking retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        booking: {
                          $ref: '#/components/schemas/BookingWithRelations',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - invalid booking ID' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Booking not found' },
        },
      },
      put: {
        summary: 'Update booking',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Booking ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  startTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Updated start time',
                  },
                  endTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Updated end time',
                  },
                  pickupLocation: {
                    type: 'string',
                    description: 'Updated pickup location',
                  },
                  dropoffLocation: {
                    type: 'string',
                    description: 'Updated dropoff location',
                  },
                  notes: {
                    type: 'string',
                    description: 'Additional notes',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Booking updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Booking updated successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        booking: {
                          $ref: '#/components/schemas/BookingWithRelations',
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
              'Bad request - cannot update completed or cancelled bookings',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Booking not found' },
        },
      },
    },
    '/api/bookings/{id}/status': {
      patch: {
        summary: 'Update booking status',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Booking ID',
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
                    enum: [
                      'PENDING',
                      'CONFIRMED',
                      'IN_PROGRESS',
                      'COMPLETED',
                      'CANCELLED',
                    ],
                    description: 'New booking status',
                  },
                  notes: {
                    type: 'string',
                    description: 'Optional notes for status change',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Booking status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Booking status updated successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        booking: {
                          $ref: '#/components/schemas/BookingWithRelations',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - invalid status value' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - admin/staff only' },
          404: { description: 'Booking not found' },
        },
      },
    },
    '/api/bookings/{id}/cancel': {
      patch: {
        summary: 'Cancel booking',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Booking ID',
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: {
                    type: 'string',
                    description: 'Reason for cancellation',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Booking cancelled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Booking cancelled successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        booking: {
                          $ref: '#/components/schemas/BookingWithRelations',
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
              'Bad request - cannot cancel completed, cancelled, or in-progress bookings',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Booking not found' },
        },
      },
    },
    '/api/bookings/{id}/complete': {
      post: {
        summary: 'Complete a booking',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Booking ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['actualEndTime'],
                properties: {
                  actualEndTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Actual end time of the rental',
                  },
                  actualReturnLocation: {
                    type: 'string',
                    description: 'Actual return location',
                  },
                  returnOdometer: {
                    type: 'number',
                    description: 'Odometer reading at return',
                  },
                  notes: {
                    type: 'string',
                    description: 'Additional notes',
                  },
                  damageReport: {
                    type: 'string',
                    description: 'Any damage report',
                  },
                  fuelLevel: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Battery/fuel level percentage',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Booking completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Booking completed successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        booking: {
                          $ref: '#/components/schemas/BookingWithRelations',
                        },
                        summary: {
                          type: 'object',
                          properties: {
                            duration: { type: 'string', example: '5 hours' },
                            distance: { type: 'string', example: '120.5 km' },
                            startTime: { type: 'string', format: 'date-time' },
                            endTime: { type: 'string', format: 'date-time' },
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
              'Bad request - invalid data or booking not in progress',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Booking not found' },
        },
      },
    },
    // Document endpoints
    '/api/documents/upload': {
      post: {
        summary: 'Upload a document',
        tags: ['Documents'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  document: {
                    type: 'string',
                    format: 'binary',
                    description: 'Document file to upload (JPG, PNG, PDF)',
                  },
                  documentType: {
                    type: 'string',
                    enum: ['DRIVERS_LICENSE', 'ID_CARD', 'PASSPORT'],
                    description: 'Type of document being uploaded',
                  },
                  documentNumber: {
                    type: 'string',
                    description: 'Document number (optional)',
                  },
                  expiryDate: {
                    type: 'string',
                    format: 'date',
                    description: 'Document expiry date (optional)',
                  },
                },
                required: ['document', 'documentType'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Document uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Document uploaded successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        documentType: { type: 'string' },
                        fileName: { type: 'string' },
                        status: { type: 'string', example: 'PENDING' },
                        uploadedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              'Bad request - no file uploaded or invalid file type/size',
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/documents/my-documents': {
      get: {
        summary: 'Get user documents',
        tags: ['Documents'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of user documents',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          documentType: { type: 'string' },
                          fileName: { type: 'string' },
                          fileUrl: { type: 'string' },
                          fileId: { type: 'string' },
                          thumbnailUrl: { type: 'string', nullable: true },
                          status: { type: 'string' },
                          uploadedAt: { type: 'string', format: 'date-time' },
                          verifiedAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                          },
                          rejectionReason: { type: 'string', nullable: true },
                          expiryDate: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                          },
                          documentNumber: { type: 'string', nullable: true },
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
    '/api/documents/{documentId}': {
      delete: {
        summary: 'Delete a document',
        tags: ['Documents'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'documentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Document ID',
          },
        ],
        responses: {
          200: {
            description: 'Document deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Document deleted successfully',
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Document not found' },
        },
      },
    },
    '/api/documents/all': {
      get: {
        summary: 'Get all documents (Admin only)',
        tags: ['Documents'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by document status',
          },
          {
            name: 'documentType',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by document type',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', example: 1 },
            description: 'Page number for pagination',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', example: 20 },
            description: 'Number of items per page',
          },
        ],
        responses: {
          200: {
            description: 'List of all documents',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        documents: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              userId: { type: 'string' },
                              documentType: { type: 'string' },
                              fileName: { type: 'string' },
                              fileUrl: { type: 'string' },
                              fileId: { type: 'string' },
                              thumbnailUrl: { type: 'string', nullable: true },
                              status: { type: 'string' },
                              uploadedAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              verifiedAt: {
                                type: 'string',
                                format: 'date-time',
                                nullable: true,
                              },
                              rejectionReason: {
                                type: 'string',
                                nullable: true,
                              },
                              expiryDate: {
                                type: 'string',
                                format: 'date-time',
                                nullable: true,
                              },
                              documentNumber: {
                                type: 'string',
                                nullable: true,
                              },
                              user: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string' },
                                  email: { type: 'string' },
                                  phone: { type: 'string' },
                                },
                              },
                            },
                          },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            total: { type: 'integer' },
                            totalPages: { type: 'integer' },
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
          403: { description: 'Forbidden - Admin access required' },
        },
      },
    },
    '/api/documents/{documentId}/verify': {
      patch: {
        summary: 'Verify a document (Admin only)',
        tags: ['Documents'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'documentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Document ID',
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
                    enum: ['APPROVED', 'REJECTED'],
                    description: 'Verification status',
                  },
                  rejectionReason: {
                    type: 'string',
                    description:
                      'Reason for rejection (required when status is REJECTED)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Document verification status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Document approved successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        userId: { type: 'string' },
                        documentType: { type: 'string' },
                        fileName: { type: 'string' },
                        fileUrl: { type: 'string' },
                        fileId: { type: 'string' },
                        thumbnailUrl: { type: 'string', nullable: true },
                        status: { type: 'string', example: 'APPROVED' },
                        uploadedAt: { type: 'string', format: 'date-time' },
                        verifiedAt: { type: 'string', format: 'date-time' },
                        verifiedBy: { type: 'string' },
                        rejectionReason: { type: 'string', nullable: true },
                        expiryDate: {
                          type: 'string',
                          format: 'date-time',
                          nullable: true,
                        },
                        documentNumber: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              'Bad request - invalid status or missing rejection reason',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Document not found' },
        },
      },
    },
    // PayOS endpoints
    '/api/payos/create': {
      post: {
        summary: 'Create PayOS payment link',
        tags: ['PayOS'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookingId', 'amount'],
                properties: {
                  bookingId: {
                    type: 'string',
                    description: 'ID of the booking to pay for',
                  },
                  amount: {
                    type: 'number',
                    description: 'Payment amount in VND',
                  },
                  description: {
                    type: 'string',
                    description: 'Payment description (optional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Payment link created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        paymentId: { type: 'string' },
                        orderCode: { type: 'number' },
                        paymentUrl: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - missing required fields' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - access to booking denied' },
          404: { description: 'Booking not found' },
        },
      },
    },
    '/api/payos/status/{paymentId}': {
      get: {
        summary: 'Get PayOS payment status',
        tags: ['PayOS'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'paymentId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'ID of the payment',
          },
        ],
        responses: {
          200: {
            description: 'Payment status retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        paymentId: { type: 'string' },
                        status: { type: 'string' },
                        amount: { type: 'number' },
                        paymentMethod: { type: 'string' },
                        transactionId: { type: 'string' },
                        paymentDate: {
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - access to payment denied' },
          404: { description: 'Payment not found' },
        },
      },
    },
    '/api/payos/webhook': {
      post: {
        summary: 'Handle PayOS webhook callback',
        tags: ['PayOS'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  desc: { type: 'string' },
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      orderCode: { type: 'number' },
                      amount: { type: 'number' },
                      description: { type: 'string' },
                      accountNumber: { type: 'string' },
                      reference: { type: 'string' },
                      transactionDateTime: { type: 'string' },
                      currency: { type: 'string' },
                      paymentLinkId: { type: 'string' },
                      counterAccountBankId: { type: 'string' },
                      counterAccountBankName: { type: 'string' },
                      counterAccountName: { type: 'string' },
                      counterAccountNumber: { type: 'string' },
                      virtualAccountName: { type: 'string' },
                      virtualAccountNumber: { type: 'string' },
                    },
                  },
                  signature: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Webhook processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Payment endpoints
    '/api/payments': {
      post: {
        summary: 'Create a payment',
        tags: ['Payments'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookingId', 'amount', 'transactionId'],
                properties: {
                  bookingId: {
                    type: 'string',
                    description: 'ID of the booking',
                  },
                  amount: { type: 'number', description: 'Payment amount' },
                  paymentMethod: {
                    type: 'string',
                    description: 'Payment method (optional)',
                  },
                  transactionId: {
                    type: 'string',
                    description: 'Unique transaction ID',
                  },
                  paymentDate: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Payment date (optional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Payment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        payment: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            userId: { type: 'string' },
                            bookingId: { type: 'string' },
                            amount: { type: 'number' },
                            paymentMethod: { type: 'string', nullable: true },
                            transactionId: { type: 'string' },
                            status: { type: 'string', example: 'PAID' },
                            paymentDate: {
                              type: 'string',
                              format: 'date-time',
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                          },
                        },
                        bookingStatus: { type: 'string' },
                        idempotent: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          200: { description: 'Payment already exists (idempotent response)' },
          400: { description: 'Bad request - missing required fields' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - not the booking owner' },
          404: { description: 'Booking not found' },
        },
      },
    },
    // Renter endpoints
    '/api/renters': {
      post: {
        summary: 'Create a new renter (Admin only)',
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
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'Renter email',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    description: 'Renter password',
                  },
                  name: { type: 'string', description: 'Renter name' },
                  phone: {
                    type: 'string',
                    description:
                      'Renter phone (must start with 0 and have exactly 10 digits)',
                  },
                  address: {
                    type: 'string',
                    description: 'Renter address (optional)',
                  },
                  accountStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
                    description:
                      'Account status (optional, defaults to ACTIVE)',
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
                            role: { type: 'string', example: 'RENTER' },
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          409: { description: 'Conflict - email already exists' },
        },
      },
      get: {
        summary: 'Get all renters (Admin/Staff only)',
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
                              name: { type: 'string' },
                              phone: { type: 'string', nullable: true },
                              address: { type: 'string', nullable: true },
                              role: { type: 'string', example: 'RENTER' },
                              accountStatus: { type: 'string' },
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
          403: { description: 'Forbidden - Admin/Staff access required' },
          404: { description: 'No renters found' },
        },
      },
    },
    '/api/renters/{id}': {
      get: {
        summary: 'Get renter by ID (Admin/Staff only)',
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
                            name: { type: 'string' },
                            phone: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                            role: { type: 'string', example: 'RENTER' },
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin/Staff access required' },
          404: { description: 'Renter not found' },
        },
      },
      put: {
        summary: 'Update renter (Admin only)',
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
                  name: { type: 'string', description: 'Renter name' },
                  phone: {
                    type: 'string',
                    description:
                      'Renter phone (must start with 0 and have exactly 10 digits)',
                  },
                  address: {
                    type: 'string',
                    description: 'Renter address (optional)',
                  },
                  accountStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
                    description: 'Account status (optional)',
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
                            role: { type: 'string', example: 'RENTER' },
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Renter not found' },
        },
      },
      delete: {
        summary: 'Delete renter (Admin only)',
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Renter not found' },
        },
      },
    },
    '/api/renters/{id}/soft-delete': {
      patch: {
        summary: 'Soft delete renter (Admin only)',
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
                    description: 'Account status after soft deletion',
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
          400: { description: 'Bad request - invalid status' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Renter not found' },
        },
      },
    },
    // Staff endpoints
    '/api/staff': {
      post: {
        summary: 'Create a new staff member (Admin only)',
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
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'Staff email',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    description: 'Staff password',
                  },
                  name: { type: 'string', description: 'Staff name' },
                  phone: {
                    type: 'string',
                    description:
                      'Staff phone (must start with 0 and have exactly 10 digits)',
                  },
                  address: {
                    type: 'string',
                    description: 'Staff address (optional)',
                  },
                  accountStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
                    description:
                      'Account status (optional, defaults to ACTIVE)',
                  },
                  role: {
                    type: 'string',
                    enum: ['STAFF', 'ADMIN'],
                    description: 'Staff role (optional, defaults to STAFF)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Staff member created successfully',
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
                            role: { type: 'string', example: 'STAFF' },
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
            description: 'Bad request - validation errors or invalid role',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          409: { description: 'Conflict - email already exists' },
        },
      },
      get: {
        summary: 'Get all staff members (Admin only)',
        tags: ['Staff'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of staff members',
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
                              name: { type: 'string' },
                              phone: { type: 'string', nullable: true },
                              address: { type: 'string', nullable: true },
                              role: { type: 'string' },
                              accountStatus: { type: 'string' },
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
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'No staff or admin found' },
        },
      },
    },
    '/api/staff/{id}': {
      get: {
        summary: 'Get staff member by ID (Admin only)',
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
            description: 'Staff member details',
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Staff or admin not found' },
        },
      },
      put: {
        summary: 'Update staff member (Admin only)',
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
                  name: { type: 'string', description: 'Staff name' },
                  phone: {
                    type: 'string',
                    description:
                      'Staff phone (must start with 0 and have exactly 10 digits)',
                  },
                  address: {
                    type: 'string',
                    description: 'Staff address (optional)',
                  },
                  accountStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
                    description: 'Account status (optional)',
                  },
                  role: {
                    type: 'string',
                    enum: ['STAFF', 'ADMIN'],
                    description: 'Staff role (optional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Staff member updated successfully',
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
          400: {
            description: 'Bad request - validation errors or invalid role',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Staff or admin not found' },
        },
      },
      delete: {
        summary: 'Delete staff member (Admin only)',
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
            description: 'Staff member deleted successfully',
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Staff or admin not found' },
        },
      },
    },
    '/api/staff/soft-delete/{id}': {
      patch: {
        summary: 'Soft delete staff member (Admin only)',
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
                    description: 'Account status after soft deletion',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Staff member soft deleted successfully',
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
          400: { description: 'Bad request - invalid status' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Staff or admin not found' },
        },
      },
    },
    // Station endpoints
    '/api/stations': {
      post: {
        summary: 'Create a new station (Admin only)',
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
                  name: { type: 'string', description: 'Station name' },
                  location: {
                    type: 'object',
                    description: 'Station location (coordinates)',
                  },
                  address: { type: 'string', description: 'Station address' },
                  status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
                    description: 'Station status',
                  },
                  capacity: {
                    type: 'integer',
                    description: 'Station capacity',
                  },
                  contact: {
                    type: 'string',
                    description: 'Station contact information (optional)',
                  },
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
                            contact: { type: 'string', nullable: true },
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
          400: {
            description:
              'Bad request - missing required fields or invalid status',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          409: { description: 'Conflict - station name already exists' },
        },
      },
      get: {
        summary: 'Get all stations (Admin/Staff only)',
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
                              status: { type: 'string' },
                              capacity: { type: 'integer' },
                              contact: { type: 'string', nullable: true },
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin/Staff access required' },
          404: { description: 'Station not found' },
        },
      },
    },
    '/api/stations/unavailable/all': {
      get: {
        summary: 'Get unavailable stations (Admin/Staff only)',
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
                              capacity: { type: 'integer' },
                              contact: { type: 'string', nullable: true },
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin/Staff access required' },
          404: { description: 'No unavailable stations found' },
        },
      },
    },
    '/api/stations/{id}': {
      get: {
        summary: 'Get station by ID (Admin/Staff only)',
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
                            status: { type: 'string' },
                            capacity: { type: 'integer' },
                            contact: { type: 'string', nullable: true },
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin/Staff access required' },
          404: { description: 'Station not found' },
        },
      },
      put: {
        summary: 'Update station (Admin only)',
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
                  name: { type: 'string', description: 'Station name' },
                  location: {
                    type: 'object',
                    description: 'Station location (coordinates)',
                  },
                  address: { type: 'string', description: 'Station address' },
                  status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
                    description: 'Station status',
                  },
                  capacity: {
                    type: 'integer',
                    description: 'Station capacity',
                  },
                  contact: {
                    type: 'string',
                    description: 'Station contact information (optional)',
                  },
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
                            contact: { type: 'string', nullable: true },
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
            description:
              'Bad request - missing required fields, invalid status, or station has active vehicles/bookings',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Station not found' },
          409: { description: 'Conflict - station name already exists' },
        },
      },
      delete: {
        summary: 'Delete station (Admin only)',
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
                        station: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            location: { type: 'object' },
                            address: { type: 'string', nullable: true },
                            status: { type: 'string' },
                            capacity: { type: 'integer' },
                            contact: { type: 'string', nullable: true },
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
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Station not found' },
        },
      },
    },
    '/api/stations/soft-delete/{id}': {
      patch: {
        summary: 'Soft delete station (Admin only)',
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
                            address: { type: 'string', nullable: true },
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
              'Bad request - station has active vehicles or bookings',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin access required' },
          404: { description: 'Station not found' },
        },
      },
    },
    // Test endpoints
    '/api/test/imagekit/connection': {
      get: {
        summary: 'Test ImageKit connection',
        tags: ['Test'],
        responses: {
          200: {
            description: 'ImageKit connection test result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'ImageKit connection successful',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        canUpload: { type: 'boolean' },
                        canDelete: { type: 'boolean' },
                        endpoint: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          500: { description: 'Internal server error - ImageKit test failed' },
        },
      },
    },
    '/api/test/imagekit/transformations': {
      get: {
        summary: 'Test image transformations',
        tags: ['Test'],
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'ImageKit URL to transform',
          },
        ],
        responses: {
          200: {
            description: 'Image transformations result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Image transformations generated',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        original: { type: 'string' },
                        transformations: {
                          type: 'object',
                          properties: {
                            thumbnail: { type: 'string' },
                            medium: { type: 'string' },
                            highQuality: { type: 'string' },
                            lowQuality: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - missing URL parameter' },
          500: {
            description: 'Internal server error - transformation test failed',
          },
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
    '/api/promotions': {
      get: {
        summary: 'Get all promotions',
        tags: ['Promotions'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of promotions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        promotions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              code: { type: 'string' },
                              description: { type: 'string', nullable: true },
                              discount: { type: 'number' },
                              validFrom: {
                                type: 'string',
                                format: 'date-time',
                              },
                              validUntil: {
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
                              promotionBookings: {
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
          404: { description: 'No promotions found' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new promotion',
        tags: ['Promotions'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'discount', 'validFrom', 'validUntil'],
                properties: {
                  code: {
                    type: 'string',
                    description: 'Unique promotion code',
                  },
                  description: {
                    type: 'string',
                    description: 'Promotion description',
                  },
                  discount: {
                    type: 'number',
                    description: 'Discount amount (positive number)',
                  },
                  validFrom: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Start date',
                  },
                  validUntil: {
                    type: 'string',
                    format: 'date-time',
                    description: 'End date',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Promotion created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Promotion created successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        promotion: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            code: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            discount: { type: 'number' },
                            validFrom: { type: 'string', format: 'date-time' },
                            validUntil: { type: 'string', format: 'date-time' },
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
          409: { description: 'Promotion code already exists' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/promotions/active': {
      get: {
        summary: 'Get active promotions',
        tags: ['Promotions'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of currently active promotions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        promotions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              code: { type: 'string' },
                              description: { type: 'string', nullable: true },
                              discount: { type: 'number' },
                              validFrom: {
                                type: 'string',
                                format: 'date-time',
                              },
                              validUntil: {
                                type: 'string',
                                format: 'date-time',
                              },
                              promotionBookings: {
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
          404: { description: 'No active promotions found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/promotions/code/{code}': {
      get: {
        summary: 'Get promotion by code',
        tags: ['Promotions'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Promotion code',
          },
        ],
        responses: {
          200: {
            description: 'Promotion details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        promotion: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            code: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            discount: { type: 'number' },
                            validFrom: { type: 'string', format: 'date-time' },
                            validUntil: { type: 'string', format: 'date-time' },
                            isCurrentlyValid: { type: 'boolean' },
                            promotionBookings: {
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
          404: { description: 'Promotion not found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/promotions/{id}': {
      get: {
        summary: 'Get promotion by ID',
        tags: ['Promotions'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Promotion ID',
          },
        ],
        responses: {
          200: {
            description: 'Promotion details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        promotion: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            code: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            discount: { type: 'number' },
                            validFrom: { type: 'string', format: 'date-time' },
                            validUntil: { type: 'string', format: 'date-time' },
                            promotionBookings: {
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
          404: { description: 'Promotion not found' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update promotion',
        tags: ['Promotions'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Promotion ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'string',
                    description: 'Unique promotion code',
                  },
                  description: {
                    type: 'string',
                    description: 'Promotion description',
                  },
                  discount: {
                    type: 'number',
                    description: 'Discount amount (positive number)',
                  },
                  validFrom: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Start date',
                  },
                  validUntil: {
                    type: 'string',
                    format: 'date-time',
                    description: 'End date',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Promotion updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Promotion updated successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        promotion: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            code: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            discount: { type: 'number' },
                            validFrom: { type: 'string', format: 'date-time' },
                            validUntil: { type: 'string', format: 'date-time' },
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
          404: { description: 'Promotion not found' },
          409: { description: 'Promotion code already exists' },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Delete promotion',
        tags: ['Promotions'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Promotion ID',
          },
        ],
        responses: {
          200: {
            description: 'Promotion deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Promotion deleted successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        deletedPromotion: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            code: { type: 'string' },
                            description: { type: 'string', nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Cannot delete promotion with active bookings' },
          404: { description: 'Promotion not found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/rental-history': {
      get: {
        summary: 'Get all rental histories',
        tags: ['Rental History'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number for pagination',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Number of items per page',
          },
          {
            name: 'userId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by user ID',
          },
          {
            name: 'rating',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 5 },
            description: 'Filter by rating',
          },
        ],
        responses: {
          200: {
            description: 'List of rental histories with pagination',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        rentalHistories: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              userId: { type: 'string' },
                              bookingId: { type: 'string' },
                              distance: { type: 'number' },
                              rating: { type: 'integer', nullable: true },
                              feedback: { type: 'string', nullable: true },
                              createdAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              user: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string', nullable: true },
                                  email: { type: 'string' },
                                },
                              },
                              booking: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  startTime: {
                                    type: 'string',
                                    format: 'date-time',
                                  },
                                  endTime: {
                                    type: 'string',
                                    format: 'date-time',
                                  },
                                  status: { type: 'string' },
                                  vehicle: { type: 'object' },
                                },
                              },
                            },
                          },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            currentPage: { type: 'integer' },
                            totalPages: { type: 'integer' },
                            totalItems: { type: 'integer' },
                            itemsPerPage: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'No rental histories found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
      post: {
        summary: 'Create rental history',
        tags: ['Rental History'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'bookingId'],
                properties: {
                  userId: { type: 'string', description: 'User ID' },
                  bookingId: { type: 'string', description: 'Booking ID' },
                  distance: {
                    type: 'number',
                    description: 'Distance traveled (non-negative)',
                  },
                  rating: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 5,
                    description: 'Rating (1-5 stars)',
                  },
                  feedback: { type: 'string', description: 'User feedback' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Rental history created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Rental history created successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        rentalHistory: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            userId: { type: 'string' },
                            bookingId: { type: 'string' },
                            distance: { type: 'number' },
                            rating: { type: 'integer', nullable: true },
                            feedback: { type: 'string', nullable: true },
                            createdAt: { type: 'string', format: 'date-time' },
                            user: { type: 'object' },
                            booking: { type: 'object' },
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
          404: { description: 'User or booking not found' },
          409: {
            description: 'Rental history already exists for this booking',
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
    },
    '/api/rental-history/statistics': {
      get: {
        summary: 'Get rental statistics',
        tags: ['Rental History'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter statistics by user ID',
          },
        ],
        responses: {
          200: {
            description: 'Rental statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        statistics: {
                          type: 'object',
                          properties: {
                            totalRentals: { type: 'integer' },
                            averageRating: { type: 'number' },
                            totalDistance: { type: 'number' },
                            ratingDistribution: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  rating: { type: 'integer' },
                                  count: { type: 'integer' },
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
        },
      },
    },
    '/api/rental-history/user/{userId}': {
      get: {
        summary: 'Get rental histories by user ID',
        tags: ['Rental History'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number for pagination',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Number of items per page',
          },
        ],
        responses: {
          200: {
            description: 'User rental histories with pagination',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        rentalHistories: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              distance: { type: 'number' },
                              rating: { type: 'integer', nullable: true },
                              feedback: { type: 'string', nullable: true },
                              createdAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                              booking: {
                                type: 'object',
                                properties: {
                                  vehicle: { type: 'object' },
                                  station: { type: 'object' },
                                },
                              },
                            },
                          },
                        },
                        pagination: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'User not found or no rental histories found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
    },
    '/api/rental-history/booking/{bookingId}': {
      get: {
        summary: 'Get rental history by booking ID',
        tags: ['Rental History'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'bookingId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Booking ID',
          },
        ],
        responses: {
          200: {
            description: 'Rental history for the booking',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        rentalHistory: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            userId: { type: 'string' },
                            bookingId: { type: 'string' },
                            distance: { type: 'number' },
                            rating: { type: 'integer', nullable: true },
                            feedback: { type: 'string', nullable: true },
                            createdAt: { type: 'string', format: 'date-time' },
                            user: { type: 'object' },
                            booking: { type: 'object' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Rental history not found for this booking' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
    },
    '/api/rental-history/{id}': {
      get: {
        summary: 'Get rental history by ID',
        tags: ['Rental History'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Rental history ID',
          },
        ],
        responses: {
          200: {
            description: 'Rental history details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        rentalHistory: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            userId: { type: 'string' },
                            bookingId: { type: 'string' },
                            distance: { type: 'number' },
                            rating: { type: 'integer', nullable: true },
                            feedback: { type: 'string', nullable: true },
                            createdAt: { type: 'string', format: 'date-time' },
                            user: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string', nullable: true },
                                email: { type: 'string' },
                                phone: { type: 'string', nullable: true },
                              },
                            },
                            booking: {
                              type: 'object',
                              properties: {
                                vehicle: { type: 'object' },
                                station: { type: 'object' },
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
          404: { description: 'Rental history not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
      put: {
        summary: 'Update rental history',
        tags: ['Rental History'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Rental history ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  distance: {
                    type: 'number',
                    description: 'Distance traveled (non-negative)',
                  },
                  rating: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 5,
                    description: 'Rating (1-5 stars)',
                  },
                  feedback: { type: 'string', description: 'User feedback' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Rental history updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Rental history updated successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        rentalHistory: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            distance: { type: 'number' },
                            rating: { type: 'integer', nullable: true },
                            feedback: { type: 'string', nullable: true },
                            user: { type: 'object' },
                            booking: { type: 'object' },
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
              'Bad request - validation errors or no valid fields provided',
          },
          404: { description: 'Rental history not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
      delete: {
        summary: 'Delete rental history',
        tags: ['Rental History'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Rental history ID',
          },
        ],
        responses: {
          200: {
            description: 'Rental history deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Rental history deleted successfully',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        deletedHistory: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            userName: { type: 'string' },
                            bookingId: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Rental history not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin only' },
        },
      },
    },
    // Inspection endpoints
    '/api/inspections': {
      post: {
        summary: 'Create a new vehicle inspection',
        tags: ['Inspections'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicleId', 'staffId', 'inspectionType'],
                properties: {
                  vehicleId: { type: 'string', description: 'Vehicle ID' },
                  staffId: { type: 'string', description: 'Staff ID' },
                  bookingId: { type: 'string', description: 'Booking ID (optional)' },
                  inspectionType: { 
                    type: 'string', 
                    enum: ['CHECK_IN', 'CHECK_OUT'],
                    description: 'Type of inspection' 
                  },
                  batteryLevel: { 
                    type: 'number', 
                    minimum: 0,
                    maximum: 100,
                    description: 'Battery level percentage (0-100)' 
                  },
                  exteriorCondition: { 
                    type: 'string', 
                    enum: ['GOOD', 'FAIR', 'POOR'],
                    description: 'Exterior condition' 
                  },
                  interiorCondition: { 
                    type: 'string', 
                    enum: ['GOOD', 'FAIR', 'POOR'],
                    description: 'Interior condition' 
                  },
                  mileage: { 
                    type: 'number', 
                    description: 'Vehicle mileage (required for check-out)' 
                  },
                  tireCondition: { 
                    type: 'string', 
                    enum: ['GOOD', 'FAIR', 'POOR'],
                    description: 'Tire condition' 
                  },
                  accessories: { 
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        present: { type: 'boolean' }
                      }
                    },
                    description: 'List of accessories and their status' 
                  },
                  damageNotes: { 
                    type: 'string', 
                    description: 'Notes about vehicle damage' 
                  },
                  notes: { 
                    type: 'string', 
                    description: 'General inspection notes' 
                  },
                  images: { 
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of image URLs' 
                  },
                  documentVerified: { 
                    type: 'boolean', 
                    description: 'Whether customer documents were verified' 
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Inspection created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Inspection created successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        inspection: { $ref: '#/components/schemas/VehicleInspection' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - missing required fields or invalid data' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
    },
    '/api/inspections/{id}': {
      get: {
        summary: 'Get inspection by ID',
        tags: ['Inspections'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Inspection ID',
          },
        ],
        responses: {
          200: {
            description: 'Inspection details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        inspection: { $ref: '#/components/schemas/VehicleInspection' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Inspection not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
      put: {
        summary: 'Update inspection record',
        tags: ['Inspections'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Inspection ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  batteryLevel: { 
                    type: 'number', 
                    minimum: 0,
                    maximum: 100,
                    description: 'Battery level percentage (0-100)' 
                  },
                  exteriorCondition: { 
                    type: 'string', 
                    enum: ['GOOD', 'FAIR', 'POOR'],
                    description: 'Exterior condition' 
                  },
                  interiorCondition: { 
                    type: 'string', 
                    enum: ['GOOD', 'FAIR', 'POOR'],
                    description: 'Interior condition' 
                  },
                  mileage: { 
                    type: 'number', 
                    description: 'Vehicle mileage' 
                  },
                  tireCondition: { 
                    type: 'string', 
                    enum: ['GOOD', 'FAIR', 'POOR'],
                    description: 'Tire condition' 
                  },
                  accessories: { 
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        present: { type: 'boolean' }
                      }
                    },
                    description: 'List of accessories and their status' 
                  },
                  damageNotes: { 
                    type: 'string', 
                    description: 'Notes about vehicle damage' 
                  },
                  notes: { 
                    type: 'string', 
                    description: 'General inspection notes' 
                  },
                  images: { 
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of image URLs' 
                  },
                  documentVerified: { 
                    type: 'boolean', 
                    description: 'Whether customer documents were verified' 
                  },
                  isCompleted: { 
                    type: 'boolean', 
                    description: 'Whether inspection is finalized' 
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Inspection updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Inspection updated successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        inspection: { $ref: '#/components/schemas/VehicleInspection' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request - invalid data' },
          404: { description: 'Inspection not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
      delete: {
        summary: 'Delete inspection record',
        tags: ['Inspections'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Inspection ID',
          },
        ],
        responses: {
          200: {
            description: 'Inspection deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Inspection deleted successfully' },
                  },
                },
              },
            },
          },
          404: { description: 'Inspection not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin only' },
        },
      },
    },
    '/api/inspections/booking/{bookingId}': {
      get: {
        summary: 'Get inspections for a specific booking (Staff/Admin)',
        tags: ['Inspections'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'bookingId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Booking ID',
          },
        ],
        responses: {
          200: {
            description: 'List of inspections for the booking',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        inspections: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/VehicleInspection' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Booking not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
    },
    '/api/inspections/booking/{bookingId}/renter': {
      get: {
        summary: 'Get inspections for a specific booking (Renter)',
        tags: ['Inspections'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'bookingId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Booking ID',
          },
        ],
        responses: {
          200: {
            description: 'List of inspections for the booking',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        inspections: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/VehicleInspection' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Booking not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
    },
    '/api/inspections/vehicle/{vehicleId}': {
      get: {
        summary: 'Get inspections for a specific vehicle',
        tags: ['Inspections'],
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
            description: 'List of inspections for the vehicle',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        inspections: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/VehicleInspection' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Vehicle not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
    },
    '/api/inspections/staff/{staffId}': {
      get: {
        summary: 'Get inspections conducted by a specific staff member',
        tags: ['Inspections'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'staffId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Staff ID',
          },
        ],
        responses: {
          200: {
            description: 'List of inspections conducted by staff member',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        inspections: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/VehicleInspection' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Staff member not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Insufficient permissions' },
        },
      },
    },
    '/api/inspections/stats': {
      get: {
        summary: 'Get inspection statistics',
        tags: ['Inspections'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Inspection statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        conditionStats: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              exteriorCondition: { type: 'string' },
                              _count: { type: 'integer' },
                            },
                          },
                        },
                        typeStats: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              inspectionType: { type: 'string' },
                              _count: { type: 'integer' },
                            },
                          },
                        },
                        recentInspections: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/VehicleInspection' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin only' },
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
    schemas: {
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Booking ID' },
          userId: { type: 'string', description: 'User ID' },
          vehicleId: { type: 'string', description: 'Vehicle ID' },
          stationId: { type: 'string', description: 'Station ID' },
          startTime: {
            type: 'string',
            format: 'date-time',
            description: 'Planned start time',
          },
          endTime: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Planned end time',
          },
          actualStartTime: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Actual start time',
          },
          actualEndTime: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Actual end time',
          },
          pickupLocation: {
            type: 'string',
            nullable: true,
            description: 'Planned pickup location',
          },
          dropoffLocation: {
            type: 'string',
            nullable: true,
            description: 'Planned dropoff location',
          },
          actualPickupLocation: {
            type: 'string',
            nullable: true,
            description: 'Actual pickup location',
          },
          actualReturnLocation: {
            type: 'string',
            nullable: true,
            description: 'Actual return location',
          },
          pickupOdometer: {
            type: 'number',
            nullable: true,
            description: 'Odometer reading at pickup',
          },
          returnOdometer: {
            type: 'number',
            nullable: true,
            description: 'Odometer reading at return',
          },
          notes: {
            type: 'string',
            nullable: true,
            description: 'Additional notes',
          },
          status: {
            type: 'string',
            enum: [
              'PENDING',
              'CONFIRMED',
              'IN_PROGRESS',
              'COMPLETED',
              'CANCELLED',
            ],
            description: 'Booking status',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      BookingWithRelations: {
        allOf: [
          { $ref: '#/components/schemas/Booking' },
          {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', nullable: true },
                  email: { type: 'string' },
                  phone: { type: 'string', nullable: true },
                },
              },
              vehicle: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  model: { type: 'string' },
                  licensePlate: { type: 'string' },
                  batteryLevel: { type: 'number', nullable: true },
                  status: { type: 'string' },
                },
              },
              station: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  address: { type: 'string' },
                },
              },
              payments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    amount: { type: 'number' },
                    status: { type: 'string' },
                  },
                },
              },
              appliedPromotions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    code: { type: 'string' },
                    discount: { type: 'number' },
                  },
                },
              },
            },
          },
        ],
      },
      VehicleInspection: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Inspection ID' },
          vehicleId: { type: 'string', description: 'Vehicle ID' },
          staffId: { type: 'string', description: 'Staff ID' },
          bookingId: { type: 'string', nullable: true, description: 'Booking ID' },
          inspectionType: { 
            type: 'string', 
            enum: ['CHECK_IN', 'CHECK_OUT'],
            description: 'Type of inspection' 
          },
          batteryLevel: { 
            type: 'number', 
            description: 'Battery level percentage (0-100)' 
          },
          exteriorCondition: { 
            type: 'string', 
            enum: ['GOOD', 'FAIR', 'POOR'],
            description: 'Exterior condition' 
          },
          interiorCondition: { 
            type: 'string', 
            enum: ['GOOD', 'FAIR', 'POOR'],
            description: 'Interior condition' 
          },
          mileage: { 
            type: 'number', 
            nullable: true,
            description: 'Vehicle mileage' 
          },
          tireCondition: { 
            type: 'string', 
            enum: ['GOOD', 'FAIR', 'POOR'],
            nullable: true,
            description: 'Tire condition' 
          },
          accessories: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                present: { type: 'boolean' }
              }
            },
            description: 'List of accessories and their status' 
          },
          damageNotes: { 
            type: 'string', 
            nullable: true,
            description: 'Notes about vehicle damage' 
          },
          notes: { 
            type: 'string', 
            nullable: true,
            description: 'General inspection notes' 
          },
          images: { 
            type: 'array',
            items: { type: 'string' },
            nullable: true,
            description: 'Array of image URLs' 
          },
          documentVerified: { 
            type: 'boolean', 
            description: 'Whether customer documents were verified' 
          },
          isCompleted: { 
            type: 'boolean', 
            description: 'Whether inspection is finalized' 
          },
          createdAt: { 
            type: 'string', 
            format: 'date-time',
            description: 'Creation timestamp' 
          },
          updatedAt: { 
            type: 'string', 
            format: 'date-time',
            description: 'Last update timestamp' 
          },
          vehicle: { $ref: '#/components/schemas/Vehicle' },
          staff: { 
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
          booking: { $ref: '#/components/schemas/Booking' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Vehicle ID' },
          stationId: { type: 'string', description: 'Station ID' },
          type: { 
            type: 'string', 
            enum: ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'TRUCK', 'VAN'],
            description: 'Vehicle type' 
          },
          brand: { type: 'string', description: 'Vehicle brand' },
          model: { type: 'string', description: 'Vehicle model' },
          year: { type: 'integer', description: 'Vehicle year' },
          color: { type: 'string', description: 'Vehicle color' },
          seats: { type: 'integer', description: 'Number of seats' },
          licensePlate: { type: 'string', nullable: true, description: 'License plate' },
          batteryLevel: { type: 'number', description: 'Battery level percentage (0-100)' },
          fuelType: { 
            type: 'string', 
            enum: ['ELECTRIC', 'HYBRID', 'GASOLINE'],
            description: 'Fuel type' 
          },
          status: { 
            type: 'string', 
            enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED', 'OUT_OF_SERVICE'],
            description: 'Vehicle status' 
          },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
        },
      },
    },
  },
};
