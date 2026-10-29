export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'UniTask - Student Assignment Management System REST API',
    version: '1.0.0',
    description: 'RESTful API for university students, teachers, and administrators with Neon PostgreSQL database integration.'
  },
  servers: [
    {
      url: '/api',
      description: 'University System API Gateway'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT session token in Authorization: Bearer <token>'
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health check and database connectivity diagnostic',
        responses: { '200': { description: 'Health status confirmed' } }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register as student or teacher (admin excluded)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['full_name', 'email', 'password', 'role'],
                properties: {
                  full_name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  role: { type: 'string', enum: ['student', 'teacher'] },
                  department: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'User account created' }, '400': { description: 'Validation failed' } }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate credentials and obtain JWT session token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Authentication successful with JWT' }, '401': { description: 'Invalid credentials' } }
      }
    },
    '/courses': {
      get: {
        summary: 'Get courses (role-filtered for students/teachers)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'List of accessible courses' } }
      },
      post: {
        summary: 'Create course (Teacher or Admin only)',
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Course created' } }
      }
    },
    '/assignments': {
      get: {
        summary: 'List assignments with deadline and completion statuses',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'List of assignments' } }
      },
      post: {
        summary: 'Create assignment with deadline and late submission policy',
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Assignment created' } }
      }
    },
    '/assignments/{id}/submissions': {
      post: {
        summary: 'Submit work with file upload and text comments',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Submission accepted and timestamped' } }
      }
    },
    '/submissions/{id}/grade': {
      post: {
        summary: 'Grade submission with numerical marks and written feedback',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Grade saved or published' } }
      }
    },
    '/grades/mine': {
      get: {
        summary: 'View published grades, GPA, and performance summary',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Student grade records' } }
      }
    }
  }
};
