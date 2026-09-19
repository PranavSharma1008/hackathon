import { Router } from 'express';
import { ProviderController } from '../controllers/providerController.js';

const router = Router();

router.post('/apply', ProviderController.apply);
router.get('/my-application', ProviderController.getMyApplication);

export default router;
