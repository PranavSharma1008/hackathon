import { Router } from 'express';
import { ProcessorController } from '../controllers/processorController.js';

const router = Router();

// POST /api/processors - Post processor crop demand
router.post('/', ProcessorController.createProcessor);

// GET /api/processors - List all processor demands
router.get('/', ProcessorController.getProcessors);

// GET /api/processors/:id - Get specific processor demand
router.get('/:id', ProcessorController.getProcessorById);

export default router;
