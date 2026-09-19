import { ApplicationModel } from '../models/applicationModel.js';
import { UserModel } from '../models/userModel.js';
import { ProcessorModel } from '../models/processorModel.js';
import { FarmerModel } from '../models/farmerModel.js';
import { ContractModel } from '../models/contractModel.js';
import { StoreModel } from '../models/storeModel.js';
import { DeliveryModel } from '../models/deliveryModel.js';
import { OrderModel } from '../models/orderModel.js';

export class AdminController {
  static async getAllPlatformData(req, res, next) {
    try {
      const farmers = FarmerModel.findAll();
      const processors = ProcessorModel.findAll();
      const contracts = ContractModel.findAll();
      const deliveries = DeliveryModel.findAll();
      const stores = StoreModel.findAll({ status: null });
      const orders = OrderModel.findAll();
      const applications = ApplicationModel.findAll();
      const users = UserModel.findAll();

      const totalAcreage = farmers.reduce((acc, f) => acc + (Number(f.total_acreage) || 0), 0);
      const totalSiloValue = stores.reduce((acc, s) => acc + (Number(s.total_value_inr) || 0), 0);
      const totalContractValue = contracts.reduce((acc, c) => acc + ((Number(c.agreed_price) || 0) * (Number(c.quantity) || 1)), 0);
      const totalStoreVolume = stores.reduce((acc, s) => acc + (Number(s.quantity_quintals) || 0), 0);

      const stats = {
        farmers_count: farmers.length,
        processors_count: processors.length,
        contracts_count: contracts.length,
        deliveries_count: deliveries.length,
        store_items_count: stores.length,
        orders_count: orders.length,
        applications_count: applications.length,
        users_count: users.length,
        visitors_count: users.filter(u => u.role === 'visitor').length,
        pending_applications: applications.filter(a => a.status === 'pending').length,
        total_acreage: totalAcreage,
        total_silo_value: totalSiloValue,
        total_contract_value: totalContractValue,
        total_store_volume_quintals: totalStoreVolume
      };

      return res.status(200).json({
        success: true,
        data: {
          stats,
          users,
          farmers,
          processors,
          contracts,
          deliveries,
          stores,
          orders,
          applications
        }
      });
    } catch (error) {
      next(error);
    }
  }
  static async listApplications(req, res, next) {
    try {
      const { status } = req.query;
      const applications = ApplicationModel.findAll(status || null);
      return res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveApplication(req, res, next) {
    try {
      const { id } = req.params;
      const { admin_notes } = req.body;

      const app = ApplicationModel.findById(id);
      if (!app) {
        return res.status(404).json({
          success: false,
          error: `Application with ID ${id} not found`
        });
      }

      // 1. Update Application Status
      const updatedApp = ApplicationModel.updateStatus(id, {
        status: 'approved',
        admin_notes: admin_notes || 'Approved by Admin (codekalesh@gmail.com). Verified as Trusted Processor.'
      });

      // 2. Upgrade User Account if user exists
      let user = null;
      if (app.user_id) {
        user = UserModel.update(app.user_id, {
          role: 'processor',
          is_trusted_processor: 1
        });
      } else {
        const userRow = UserModel.findByEmail(app.user_email);
        if (userRow) {
          user = UserModel.update(userRow.id, {
            role: 'processor',
            is_trusted_processor: 1
          });
        }
      }

      // 3. Create or Register into Processors table
      const processor = ProcessorModel.create({
        user_id: user?.id || app.user_id || null,
        is_trusted: 1,
        is_service_active: 1,
        company_name: app.company_name,
        location: {
          latitude: app.location.latitude,
          longitude: app.location.longitude,
          address: app.address || 'Verified Agro Processing Hub'
        },
        required_crop: (app.target_crops || 'Wheat').split(',')[0].trim(),
        required_grade: 'Grade A',
        quantity_needed_tons: app.processing_capacity_tons || 100,
        max_distance_km: 100,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        target_price_per_ton: 24500
      });

      return res.status(200).json({
        success: true,
        message: `Successfully verified and approved ${app.company_name} as a Trusted Processor!`,
        application: updatedApp,
        user,
        processor
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectApplication(req, res, next) {
    try {
      const { id } = req.params;
      const { admin_notes } = req.body;

      const app = ApplicationModel.findById(id);
      if (!app) {
        return res.status(404).json({
          success: false,
          error: `Application with ID ${id} not found`
        });
      }

      const updatedApp = ApplicationModel.updateStatus(id, {
        status: 'rejected',
        admin_notes: admin_notes || 'Application reviewed and rejected by Administrator.'
      });

      return res.status(200).json({
        success: true,
        message: `Application ${id} has been rejected.`,
        application: updatedApp
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req, res, next) {
    try {
      const farmersCount = FarmerModel.count();
      const processorsCount = ProcessorModel.count();
      const contractsCount = ContractModel.count();
      const pendingApplications = ApplicationModel.countPending();
      const storeItemsCount = StoreModel.count();
      const usersCount = UserModel.count();
      const visitorsCount = UserModel.findByRole('visitor').length;

      return res.status(200).json({
        success: true,
        data: {
          farmers_count: farmersCount,
          processors_count: processorsCount,
          visitors_count: visitorsCount,
          contracts_count: contractsCount,
          pending_applications: pendingApplications,
          store_items_count: storeItemsCount,
          users_count: usersCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleTrust(req, res, next) {
    try {
      const { id } = req.params;
      const user = UserModel.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const newTrust = !user.is_trusted_processor;
      const updated = UserModel.update(id, {
        is_trusted_processor: newTrust ? 1 : 0,
        role: newTrust ? 'processor' : user.role
      });

      return res.status(200).json({
        success: true,
        message: `User ${user.email} trust status updated to ${newTrust}`,
        user: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req, res, next) {
    try {
      const { role } = req.query;
      const users = role ? UserModel.findByRole(role) : UserModel.findAll();
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role, is_trusted_processor } = req.body;
      const user = UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const updates = {};
      if (role) {
        updates.role = role;
        updates.requested_role = null;
        updates.requested_at = null;
      }
      if (is_trusted_processor !== undefined) updates.is_trusted_processor = is_trusted_processor;

      const updated = UserModel.update(id, updates);

      // If user is promoted to farmer, ensure farmer profile exists
      if (role === 'farmer') {
        const existingFarm = FarmerModel.findByUserId(id) || FarmerModel.findByEmail(user.email);
        if (!existingFarm) {
          FarmerModel.create({
            user_id: id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            location: { latitude: 30.7073, longitude: 76.2167, address: 'Agri Farmlands Cluster' },
            soil_type: 'Loamy',
            total_acreage: 25,
            is_service_active: 1
          });
        }
      }

      // If user is promoted to processor, ensure processor profile exists
      if (role === 'processor') {
        const existingProc = ProcessorModel.findByUserId(id);
        if (!existingProc) {
          ProcessorModel.create({
            user_id: id,
            company_name: `${user.name} Agro Milling`,
            location: { latitude: 30.9010, longitude: 75.8573, address: 'Agri Processing District' },
            required_crop: 'Wheat',
            required_grade: 'Grade A',
            quantity_needed_tons: 200,
            max_distance_km: 80,
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            is_trusted: 1,
            is_service_active: 1
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: `User ${user.email} role updated to ${role}`,
        user: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleService(req, res, next) {
    try {
      const { id } = req.params;
      const user = UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const newServiceStatus = user.service_status === 1 ? 0 : 1;
      const updated = UserModel.update(id, { service_status: newServiceStatus });

      if (user.role === 'farmer') {
        const farm = FarmerModel.findByUserId(id) || FarmerModel.findByEmail(user.email);
        if (farm) {
          FarmerModel.update(farm.id, { is_service_active: newServiceStatus });
        }
      } else if (user.role === 'processor') {
        const proc = ProcessorModel.findByUserId(id);
        if (proc) {
          ProcessorModel.update(proc.id, { is_service_active: newServiceStatus });
        }
      }

      return res.status(200).json({
        success: true,
        message: `Service status for ${user.name} toggled to ${newServiceStatus === 1 ? 'ON' : 'OFF'}`,
        user: updated,
        service_status: newServiceStatus === 1
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectRoleRequest(req, res, next) {
    try {
      const { id } = req.params;
      const user = UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const updated = UserModel.update(id, {
        requested_role: null,
        requested_at: null
      });

      return res.status(200).json({
        success: true,
        message: `Role request for ${user.name} has been dismissed.`,
        user: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
