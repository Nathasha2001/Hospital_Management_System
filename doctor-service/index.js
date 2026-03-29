const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const Doctor = require('./models/Doctor');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Doctor Service API',
      version: '1.0.0',
      description: 'API for managing hospital doctors',
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       required:
 *         - name
 *         - specialization
 *         - contact
 *         - email
 *       properties:
 *         id:
 *           type: number
 *           description: Auto-generated doctor ID
 *         name:
 *           type: string
 *           description: Doctor name
 *         specialization:
 *           type: string
 *           description: Doctor specialization
 *         contact:
 *           type: string
 *           description: Contact number
 *         email:
 *           type: string
 *           description: Email address
 *       example:
 *         id: 1
 *         name: 'Dr. Smith'
 *         specialization: 'Cardiology'
 *         contact: '123-456-7890'
 *         email: 'smith@hospital.com'
 */

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: List of all doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 */
app.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-_id -__v');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors', details: error.message });
  }
});

app.use('/doctors/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor not found
 */
app.get('/doctors/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid doctor ID' });
  }
  
  try {
    const doctor = await Doctor.findOne({ id }).select('-_id -__v');
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor', details: error.message });
  }
});

/**
 * @swagger
 * /doctors:
 *   post:
 *     summary: Create a new doctor
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - specialization
 *               - contact
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               specialization:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Invalid input
 */
app.post('/doctors', async (req, res) => {
  const { name, specialization, contact, email } = req.body;
  
  if (!name || !specialization || !contact || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const lastDoctor = await Doctor.findOne().sort({ id: -1 });
    const nextId = lastDoctor ? lastDoctor.id + 1 : 1;
    
    const newDoctor = new Doctor({
      id: nextId,
      name,
      specialization,
      contact,
      email
    });
    
    await newDoctor.save();
    
    const response = newDoctor.toObject();
    delete response._id;
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;
    
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create doctor', details: error.message });
  }
});

/**
 * @swagger
 * /doctors/{id}:
 *   put:
 *     summary: Update an existing doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               specialization:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor not found
 *       400:
 *         description: Invalid ID
 */
app.put('/doctors/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid doctor ID' });
  }
  
  try {
    const { name, specialization, contact, email } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (contact !== undefined) updateData.contact = contact;
    if (email !== undefined) updateData.email = email;
    
    const doctor = await Doctor.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    ).select('-_id -__v');
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});
