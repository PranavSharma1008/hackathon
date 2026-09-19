import { Router } from 'express';
import { MatchController } from '../controllers/matchController.js';

const router = Router();

// GET /api/match/:processor_id - AI Matching Engine
router.get('/:processor_id', MatchController.getMatches);

export default router;
