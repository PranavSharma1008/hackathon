import { Router } from 'express';
import farmerRoutes from './farmerRoutes.js';
import processorRoutes from './processorRoutes.js';
import matchRoutes from './matchRoutes.js';
import contractRoutes from './contractRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import authRoutes from './authRoutes.js';
import providerRoutes from './providerRoutes.js';
import adminRoutes from './adminRoutes.js';
import storeRoutes from './storeRoutes.js';
import { seedDatabase } from '../seed.js';
import { FarmerModel } from '../models/farmerModel.js';
import { ProcessorModel } from '../models/processorModel.js';
import { ContractModel } from '../models/contractModel.js';
import { DeliveryModel } from '../models/deliveryModel.js';
import { UserModel } from '../models/userModel.js';
import { ApplicationModel } from '../models/applicationModel.js';
import { StoreModel } from '../models/storeModel.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'Contract Farming Matchmaker',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      farmers_count: FarmerModel.count(),
      processors_count: ProcessorModel.count(),
      contracts_count: ContractModel.count(),
      deliveries_count: DeliveryModel.count(),
      users_count: UserModel.count(),
      store_items_count: StoreModel.count(),
      pending_applications: ApplicationModel.countPending()
    }
  });
});

// Seed endpoint - Useful for testing & demo resets
router.post('/seed', (req, res, next) => {
  try {
    const force = req.query.force === 'true' || req.body?.force === true;
    const result = seedDatabase({ force });
    res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      stats: result
    });
  } catch (error) {
    next(error);
  }
});

// Domain Routes
router.use('/auth', authRoutes);
router.use('/providers', providerRoutes);
router.use('/admin', adminRoutes);
router.use('/store', storeRoutes);
router.use('/farmers', farmerRoutes);
router.use('/processors', processorRoutes);
router.use('/match', matchRoutes);
router.use('/contracts', contractRoutes);
router.use('/deliveries', deliveryRoutes);

export default router;
