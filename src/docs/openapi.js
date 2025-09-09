export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EV Rental API',
    version: '1.0.0',
    description: 'API documentation for EV Rental backend',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local Dev Server' }],
  paths: {
    '/health': {
      get: {
        summary: 'Simple healthcheck',
        tags: ['Health'],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/health': {
      get: {
        summary: 'API health (standardized response)',
        tags: ['Health'],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                      },
                    },
                    message: { type: 'string', example: '' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
