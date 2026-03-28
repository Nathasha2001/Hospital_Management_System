const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const Appointment = require('./models/Appointment');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Appointment Service API',
      version: '1.0.0',
      description: 'API for managing hospital appointments',
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Development server',
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - date
 *         - time
 *       properties:
 *         id:
 *           type: number
 *           description: Auto-generated appointment ID
 *         patientId:
 *           type: number
 *           description: Patient ID
 *         doctorId:
 *           type: number
 *           description: Doctor ID
 *         date:
 *           type: string
 *           description: Appointment date
 *         time:
 *           type: string
 *           description: Appointment time
 *       example:
 *         id: 1
 *         patientId: 101
 *         doctorId: 201
 *         date: '2024-04-01'
 *         time: '10:00 AM'
 */

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/appointments/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: List of all appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
app.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().select('-_id -__v');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: error.message });
  }
});

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 */
app.get('/appointments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid appointment ID' });
  }
  
  try {
    const appointment = await Appointment.findOne({ id }).select('-_id -__v');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment', details: error.message });
  }
});

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorId
 *               - date
 *               - time
 *             properties:
 *               patientId:
 *                 type: number
 *               doctorId:
 *                 type: number
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input
 */
app.post('/appointments', async (req, res) => {
  const { patientId, doctorId, date, time } = req.body;
  
  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const lastAppointment = await Appointment.findOne().sort({ id: -1 });
    const nextId = lastAppointment ? lastAppointment.id + 1 : 1;
    
    const newAppointment = new Appointment({
      id: nextId,
      patientId,
      doctorId,
      date,
      time
    });
    
    await newAppointment.save();
    
    const response = newAppointment.toObject();
    delete response._id;
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;
    
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment', details: error.message });
  }
});

/**
 * @swagger
 * /appointments/{id}:
 *   put:
 *     summary: Update an existing appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: number
 *               doctorId:
 *                 type: number
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 *       400:
 *         description: Invalid ID
 */
app.put('/appointments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid appointment ID' });
  }
  
  try {
    const { patientId, doctorId, date, time } = req.body;
    
    const updateData = {};
    if (patientId !== undefined) updateData.patientId = patientId;
    if (doctorId !== undefined) updateData.doctorId = doctorId;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    
    const appointment = await Appointment.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    ).select('-_id -__v');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment', details: error.message });
  }
});

/**
 * @swagger
 * /appointments/{id}:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       404:
 *         description: Appointment not found
 *       400:
 *         description: Invalid ID
 */
app.delete('/appointments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid appointment ID' });
  }
  
  try {
    const appointment = await Appointment.findOneAndDelete({ id });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});
