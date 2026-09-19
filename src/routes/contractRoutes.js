import { Router } from 'express';
import { ContractController } from '../controllers/contractController.js';

const router = Router();

// POST /api/contracts/generate - AI Contract Generator
router.post('/generate', ContractController.generateContract);

// GET /api/contracts - List contracts
router.get('/', ContractController.getContracts);

// GET /api/contracts/:id - Get specific contract
router.get('/:id', ContractController.getContractById);

// PATCH /api/contracts/:id/sign - Sign a pending contract
router.patch('/:id/sign', ContractController.signContract);

// PATCH /api/contracts/:id/serve - Serve/Accept request
router.patch('/:id/serve', ContractController.serveContract);

// PATCH /api/contracts/:id/cancel - Cancel/Decline request
router.patch('/:id/cancel', ContractController.cancelContract);

export default router;
