const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const Patient = require('./models/Patient');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Patient Service API',
      version: '1.0.0',
      description: 'API for managing hospital patients',
    },
    servers: [
      {
        url: 'http://localhost:5001',
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
 *     Patient:
 *       type: object
 *       required:
 *         - name
 *         - age
 *         - gender
 *         - contact
 *         - address
 *       properties:
 *         id:
 *           type: number
 *           description: Auto-generated patient ID
 *         name:
 *           type: string
 *           description: Patient name
 *         age:
 *           type: number
 *           description: Patient age
 *         gender:
 *           type: string
 *           description: Patient gender
 *         contact:
 *           type: string
 *           description: Contact number
 *         address:
 *           type: string
 *           description: Patient address
 *       example:
 *         id: 1
 *         name: 'John Doe'
 *         age: 35
 *         gender: 'Male'
 *         contact: '123-456-7890'
 *         address: '123 Main St'
 */

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: List of all patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 */
app.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find().select('-_id -__v');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
  }
});

app.use('/patients/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 */
app.get('/patients/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid patient ID' });
  }
  
  try {
    const patient = await Patient.findOne({ id }).select('-_id -__v');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient', details: error.message });
  }
});

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - gender
 *               - contact
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: number
 *               gender:
 *                 type: string
 *               contact:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Invalid input
 */
app.post('/patients', async (req, res) => {
  const { name, age, gender, contact, address } = req.body;
  
  if (!name || !age || !gender || !contact || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const lastPatient = await Patient.findOne().sort({ id: -1 });
    const nextId = lastPatient ? lastPatient.id + 1 : 1;
    
    const newPatient = new Patient({
      id: nextId,
      name,
      age,
      gender,
      contact,
      address
    });
    
    await newPatient.save();
    
    const response = newPatient.toObject();
    delete response._id;
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;
    
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create patient', details: error.message });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   put:
 *     summary: Update an existing patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: number
 *               gender:
 *                 type: string
 *               contact:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *       400:
 *         description: Invalid ID
 */
app.put('/patients/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid patient ID' });
  }
  
  try {
    const { name, age, gender, contact, address } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (contact !== undefined) updateData.contact = contact;
    if (address !== undefined) updateData.address = address;
    
    const patient = await Patient.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    ).select('-_id -__v');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient', details: error.message });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Delete a patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 *       400:
 *         description: Invalid ID
 */
app.delete('/patients/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid patient ID' });
  }
  
  try {
    const patient = await Patient.findOneAndDelete({ id });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});
