const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const Bill = require('./models/Bill');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Billing Service API',
      version: '1.0.0',
      description: 'API for managing hospital billing',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'API Gateway',
      },
      {
        url: 'http://localhost:3004',
        description: 'Direct Billing Service',
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
 *     Bill:
 *       type: object
 *       required:
 *         - patientId
 *         - amount
 *         - description
 *       properties:
 *         id:
 *           type: number
 *           description: Auto-generated bill ID
 *         patientId:
 *           type: number
 *           description: Patient ID
 *         amount:
 *           type: number
 *           description: Bill amount
 *         status:
 *           type: string
 *           enum: [pending, paid, cancelled]
 *           description: Payment status
 *         description:
 *           type: string
 *           description: Bill description
 *       example:
 *         id: 1
 *         patientId: 101
 *         amount: 500
 *         status: 'pending'
 *         description: 'Consultation fee'
 */

/**
 * @swagger
 * /bills:
 *   get:
 *     summary: Get all bills
 *     tags: [Bills]
 *     responses:
 *       200:
 *         description: List of all bills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bill'
 */
app.get('/bills', async (req, res) => {
  try {
    const bills = await Bill.find().select('-_id -__v');
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bills', details: error.message });
  }
});

app.use('/bills/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /bills/{id}:
 *   get:
 *     summary: Get bill by ID
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Bill ID
 *     responses:
 *       200:
 *         description: Bill details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bill'
 *       404:
 *         description: Bill not found
 */
app.get('/bills/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid bill ID' });
  }
  
  try {
    const bill = await Bill.findOne({ id }).select('-_id -__v');
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bill', details: error.message });
  }
});

/**
 * @swagger
 * /bills:
 *   post:
 *     summary: Create a new bill
 *     tags: [Bills]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - amount
 *               - description
 *             properties:
 *               patientId:
 *                 type: number
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, paid, cancelled]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bill created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bill'
 *       400:
 *         description: Invalid input
 */
app.post('/bills', async (req, res) => {
  const { patientId, amount, status, description } = req.body;
  
  if (!patientId || !amount || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const lastBill = await Bill.findOne().sort({ id: -1 });
    const nextId = lastBill ? lastBill.id + 1 : 1;
    
    const newBill = new Bill({
      id: nextId,
      patientId,
      amount,
      status: status || 'pending',
      description
    });
    
    await newBill.save();
    
    const response = newBill.toObject();
    delete response._id;
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;
    
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bill', details: error.message });
  }
});

/**
 * @swagger
 * /bills/{id}:
 *   put:
 *     summary: Update an existing bill
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Bill ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: number
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, paid, cancelled]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bill updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bill'
 *       404:
 *         description: Bill not found
 *       400:
 *         description: Invalid ID
 */
app.put('/bills/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid bill ID' });
  }
  
  try {
    const { patientId, amount, status, description } = req.body;
    
    const updateData = {};
    if (patientId !== undefined) updateData.patientId = patientId;
    if (amount !== undefined) updateData.amount = amount;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    
    const bill = await Bill.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    ).select('-_id -__v');
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bill', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Billing Service running on port ${PORT}`);
});
