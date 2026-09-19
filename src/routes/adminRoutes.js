import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';

const router = Router();

router.get('/overview', AdminController.getAllPlatformData);
router.get('/applications', AdminController.listApplications);
router.post('/applications/:id/approve', AdminController.approveApplication);
router.post('/applications/:id/reject', AdminController.rejectApplication);
router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.listUsers);
router.put('/users/:id/role', AdminController.updateUserRole);
router.post('/users/:id/toggle-trust', AdminController.toggleTrust);
router.post('/users/:id/toggle-service', AdminController.toggleService);
router.post('/users/:id/reject-request', AdminController.rejectRoleRequest);

export default router;
