import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController.js';

const router = Router();

// PUT /api/deliveries/track - Updates delivery milestones against the contract
router.put('/track', DeliveryController.trackDelivery);

// POST /api/deliveries - Schedule a new delivery for a contract
router.post('/', DeliveryController.createDelivery);

// GET /api/deliveries - List all deliveries
router.get('/', DeliveryController.getDeliveries);

// GET /api/deliveries/:id - Get specific delivery
router.get('/:id', DeliveryController.getDeliveryById);

export default router;
