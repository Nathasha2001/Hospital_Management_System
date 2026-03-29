const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Hospital Management System API Gateway',
    version: '1.0.0',
    description: 'Unified API documentation for all microservices',
  },
  servers: [
    {
      url: 'http://localhost:8080',
      description: 'API Gateway',
    },
  ],
  tags: [
    { name: 'Patients', description: 'Patient management endpoints' },
    { name: 'Doctors', description: 'Doctor management endpoints' },
    { name: 'Appointments', description: 'Appointment management endpoints' },
    { name: 'Bills', description: 'Billing management endpoints' },
  ],
  paths: {
    '/patients': {
      get: {
        tags: ['Patients'],
        summary: 'Get all patients',
        description: 'Retrieve a list of all patients',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      post: {
        tags: ['Patients'],
        summary: 'Create a new patient',
        description: 'Add a new patient to the system',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'age', 'gender', 'contact', 'address'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  age: { type: 'number', example: 35 },
                  gender: { type: 'string', example: 'Male' },
                  contact: { type: 'string', example: '123-456-7890' },
                  address: { type: 'string', example: '123 Main St' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Patient created successfully',
          },
        },
      },
    },
    '/patients/{id}': {
      get: {
        tags: ['Patients'],
        summary: 'Get patient by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      put: {
        tags: ['Patients'],
        summary: 'Update patient',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
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
                  age: { type: 'number' },
                  gender: { type: 'string' },
                  contact: { type: 'string' },
                  address: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Patient updated successfully',
          },
        },
      },
      delete: {
        tags: ['Patients'],
        summary: 'Delete patient',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        responses: {
          '200': {
            description: 'Patient deleted successfully',
          },
        },
      },
    },
    '/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'Get all doctors',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      post: {
        tags: ['Doctors'],
        summary: 'Create a new doctor',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'specialization', 'contact', 'email'],
                properties: {
                  name: { type: 'string', example: 'Dr. Smith' },
                  specialization: { type: 'string', example: 'Cardiology' },
                  contact: { type: 'string', example: '123-456-7890' },
                  email: { type: 'string', example: 'smith@hospital.com' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Doctor created successfully',
          },
        },
      },
    },
    '/doctors/{id}': {
      get: {
        tags: ['Doctors'],
        summary: 'Get doctor by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      put: {
        tags: ['Doctors'],
        summary: 'Update doctor',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
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
                  specialization: { type: 'string' },
                  contact: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Doctor updated successfully',
          },
        },
      },
    },
    '/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'Get all appointments',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Create a new appointment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientId', 'doctorId', 'date', 'time'],
                properties: {
                  patientId: { type: 'number', example: 1 },
                  doctorId: { type: 'number', example: 1 },
                  date: { type: 'string', example: '2024-03-30' },
                  time: { type: 'string', example: '10:00 AM' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Appointment created successfully',
          },
        },
      },
    },
    '/appointments/{id}': {
      get: {
        tags: ['Appointments'],
        summary: 'Get appointment by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      put: {
        tags: ['Appointments'],
        summary: 'Update appointment',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  patientId: { type: 'number' },
                  doctorId: { type: 'number' },
                  date: { type: 'string' },
                  time: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Appointment updated successfully',
          },
        },
      },
      delete: {
        tags: ['Appointments'],
        summary: 'Delete appointment',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        responses: {
          '200': {
            description: 'Appointment deleted successfully',
          },
        },
      },
    },
    '/bills': {
      get: {
        tags: ['Bills'],
        summary: 'Get all bills',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      post: {
        tags: ['Bills'],
        summary: 'Create a new bill',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientId', 'amount', 'description'],
                properties: {
                  patientId: { type: 'number', example: 1 },
                  amount: { type: 'number', example: 500 },
                  status: { type: 'string', enum: ['pending', 'paid', 'cancelled'], example: 'pending' },
                  description: { type: 'string', example: 'Consultation fee' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Bill created successfully',
          },
        },
      },
    },
    '/bills/{id}': {
      get: {
        tags: ['Bills'],
        summary: 'Get bill by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      put: {
        tags: ['Bills'],
        summary: 'Update bill',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  patientId: { type: 'number' },
                  amount: { type: 'number' },
                  status: { type: 'string', enum: ['pending', 'paid', 'cancelled'] },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Bill updated successfully',
          },
        },
      },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use('/patients', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to http://localhost:3001${req.url}`);
  }
}));

app.use('/doctors', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to http://localhost:3002${req.url}`);
  }
}));

app.use('/appointments', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to http://localhost:3003${req.url}`);
  }
}));

app.use('/bills', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to http://localhost:3004${req.url}`);
  }
}));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
