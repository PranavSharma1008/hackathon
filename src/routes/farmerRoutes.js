import { Router } from 'express';
import { FarmerController } from '../controllers/farmerController.js';
import { StoreController } from '../controllers/storeController.js';

const router = Router();

// POST /api/farmers - Register a farm
router.post('/', FarmerController.createFarmer);

// GET /api/farmers - List all registered farms
router.get('/', FarmerController.getFarmers);

// GET /api/farmers/:id - Get specific farm profile
router.get('/:id', FarmerController.getFarmerById);
router.put('/:id', FarmerController.updateFarmer);

// Multi-Land Parcels
router.put('/:id/parcels', FarmerController.updateFarmerParcels);
router.post('/:id/parcels', FarmerController.addLandParcel);
router.delete('/:id/parcels/:parcelId', FarmerController.deleteLandParcel);

// Farmer's Produce Store & Inventory
router.get('/:id/store', StoreController.getFarmerStore);
router.post('/:id/store', StoreController.addItemToStore);

export default router;
