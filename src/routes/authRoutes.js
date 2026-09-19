import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', AuthController.me);
router.put('/profile', AuthController.updateProfile);
router.put('/service-toggle', AuthController.toggleService);
router.put('/farmer/profile', AuthController.updateMyFarmProfile);
router.post('/request-access', AuthController.requestAccess);
router.get('/users', AuthController.listUsers);

export default router;
