import { Router } from 'express';
import { StoreController } from '../controllers/storeController.js';

const router = Router();

// Marketplace for buyers / processors
router.get('/marketplace', StoreController.getMarketplace);

// Trade requests
router.post('/requests', StoreController.createTradeRequest);
router.get('/farmer/:farmer_id/requests', StoreController.getFarmerRequests);
router.patch('/requests/:id/serve', StoreController.serveRequest);
router.patch('/requests/:id/cancel', StoreController.cancelRequest);

// Individual store item updates
router.put('/:item_id', StoreController.updateStoreItem);
router.delete('/:item_id', StoreController.deleteStoreItem);

export default router;
