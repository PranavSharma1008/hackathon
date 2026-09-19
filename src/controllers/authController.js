import { UserModel } from '../models/userModel.js';
import { FarmerModel } from '../models/farmerModel.js';
import { ProcessorModel } from '../models/processorModel.js';
import { ApplicationModel } from '../models/applicationModel.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const {
        email,
        password,
        name,
        phone,
        role = 'farmer',
        // Farmer Onboarding Requirements
        soil_type,
        total_acreage,
        address,
        latitude,
        longitude,
        past_yield_history,
        // Processor Onboarding Requirements
        company_name,
        gst_number,
        fssai_license,
        processing_capacity_tons,
        target_crops
      } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and name are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long for account security'
        });
      }

      const existing = UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please log in instead.'
        });
      }

      // Check if this is the designated admin email
      const isAdmin = email.toLowerCase().trim() === 'codekalesh@gmail.com';
      const normalizedRole = (role === 'consumer') ? 'processor' : (role || 'farmer');
      const assignedRole = isAdmin ? 'admin' : normalizedRole;
      // Immediate trusted status for admin and consumer/processor accounts
      const isTrusted = (isAdmin || assignedRole === 'processor') ? 1 : 0;

      const newUser = UserModel.create({
        email,
        password,
        name,
        phone,
        role: assignedRole,
        is_trusted_processor: isTrusted,
        service_status: 1
      });

      let farmerProfile = null;
      let processorApplication = null;
      let processorEntity = null;

      // 1. If Farmer: Persist all required farm data into database
      if (assignedRole === 'farmer') {
        const farmId = `farm_${newUser.id.replace('user_', '')}`;
        farmerProfile = FarmerModel.create({
          id: farmId,
          user_id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: phone || newUser.phone,
          location: {
            latitude: latitude || 30.7073,
            longitude: longitude || 76.2167,
            address: address || 'Agri Farmland Cluster, Punjab'
          },
          soil_type: soil_type || 'Loamy',
          total_acreage: Number(total_acreage) || 25,
          is_service_active: 1,
          past_yield_history: past_yield_history || [
            { crop: 'Wheat', tons: 30, year: 2024, grade: 'Grade A' }
          ]
        });
      }

      // 2. If Processor / Consumer: Persist corporate profile & processor entity directly with instant operational status
      if (assignedRole === 'processor' && !isAdmin) {
        processorApplication = ApplicationModel.create({
          user_id: newUser.id,
          user_email: newUser.email,
          company_name: company_name || `${newUser.name} Agro Processing`,
          phone: phone || newUser.phone,
          gst_number: gst_number || null,
          fssai_license: fssai_license || null,
          address: address || 'Industrial Agro Hub',
          latitude: latitude || 30.9010,
          longitude: longitude || 75.8573,
          processing_capacity_tons: processing_capacity_tons || 500,
          target_crops: target_crops || 'Wheat, Potato, Soybean'
        });

        // Auto-approve application for zero-delay instant onboarding
        ApplicationModel.updateStatus(processorApplication.id, {
          status: 'approved',
          admin_notes: 'Instant active consumer access granted on registration'
        });

        // Provision active processor entity immediately in database
        processorEntity = ProcessorModel.findByUserId(newUser.id);
        if (!processorEntity) {
          processorEntity = ProcessorModel.create({
            user_id: newUser.id,
            company_name: company_name || `${newUser.name} Agro Processing`,
            latitude: latitude || 30.9010,
            longitude: longitude || 75.8573,
            address: address || 'Industrial Agro Hub',
            required_crop: 'Wheat',
            required_grade: 'Grade A',
            quantity_needed_tons: 100,
            max_distance_km: 150,
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            target_price_per_ton: 24000,
            is_trusted: 1,
            is_service_active: 1
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Account registered and securely stored in database.',
        user: {
          ...newUser,
          farmer_id: farmerProfile?.id || null,
          farmer_profile: farmerProfile,
          processor_application: processorApplication,
          processor_entity: processorEntity
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const trimmedEmail = email.toLowerCase().trim();

      // Special provision for platform administrator
      if (trimmedEmail === 'codekalesh@gmail.com' && password === 'codekalesh@gmail.com') {
        let adminUser = UserModel.findByEmail('codekalesh@gmail.com');
        if (!adminUser) {
          adminUser = UserModel.create({
            id: 'user_admin_01',
            email: 'codekalesh@gmail.com',
            password: 'codekalesh@gmail.com',
            name: 'Super Admin',
            role: 'admin',
            is_trusted_processor: 1,
            service_status: 1
          });
        }
        return res.status(200).json({
          success: true,
          message: 'Admin authentication verified',
          user: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name || 'Platform Administrator',
            role: 'admin',
            is_trusted_processor: true,
            service_status: true
          }
        });
      }

      const existingRaw = UserModel.findByEmail(trimmedEmail);
      if (!existingRaw) {
        return res.status(404).json({
          success: false,
          error: `No account registered with "${trimmedEmail}". Please create an account first.`
        });
      }

      const user = UserModel.authenticate(trimmedEmail, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Incorrect password. Please verify your password or use your registered email.'
        });
      }

      // Retrieve linked farmer profile if user is a farmer
      let farmerProfile = null;
      if (user.role === 'farmer') {
        farmerProfile = FarmerModel.findByUserId(user.id) || FarmerModel.findByEmail(user.email);
      }

      // Retrieve application status if user is a processor or consumer
      let providerApp = null;
      let processorEntity = null;
      if (user.role === 'processor' || user.role === 'consumer') {
        providerApp = ApplicationModel.findByUserId(user.id) || ApplicationModel.findByEmail(user.email);
        processorEntity = ProcessorModel.findByUserId(user.id);
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          ...user,
          farmer_id: farmerProfile?.id || null,
          farmer_profile: farmerProfile,
          provider_app: providerApp,
          processor_entity: processorEntity
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const email = req.query.email || req.headers['x-user-email'];
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'User email parameter required'
        });
      }

      const userRow = UserModel.findByEmail(email);
      if (!userRow) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = UserModel.format(userRow);
      let farmerProfile = null;
      if (user.role === 'farmer') {
        farmerProfile = FarmerModel.findByUserId(user.id) || FarmerModel.findByEmail(user.email);
      }

      let providerApp = null;
      let processorEntity = null;
      if (user.role === 'processor' || user.role === 'consumer') {
        providerApp = ApplicationModel.findByUserId(user.id) || ApplicationModel.findByEmail(user.email);
        processorEntity = ProcessorModel.findByUserId(user.id);
      }

      return res.status(200).json({
        success: true,
        user: {
          ...user,
          farmer_id: farmerProfile?.id || null,
          farmer_profile: farmerProfile,
          provider_app: providerApp,
          processor_entity: processorEntity
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const {
        id,
        email,
        name,
        phone,
        password,
        // Role specific
        soil_type,
        total_acreage,
        land_parcels,
        address,
        past_yield_history,
        company_name,
        gst_number,
        fssai_license,
        target_crops,
        processing_capacity_tons
      } = req.body;

      let targetUser = null;
      if (id) {
        targetUser = UserModel.findById(id);
      } else if (email) {
        const raw = UserModel.findByEmail(email);
        targetUser = UserModel.format(raw);
      }

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User account not found'
        });
      }

      // 1. Update basic user details
      const userUpdates = {};
      if (name) userUpdates.name = name;
      if (phone !== undefined) userUpdates.phone = phone;
      if (password && password.trim().length >= 6) userUpdates.password = password.trim();

      const updatedUser = UserModel.update(targetUser.id, userUpdates);

      // 2. If Farmer, update farmer profile
      let updatedFarmer = null;
      if (targetUser.role === 'farmer') {
        const farmer = FarmerModel.findByUserId(targetUser.id) || FarmerModel.findByEmail(targetUser.email);
        if (farmer) {
          const farmerUpdates = {};
          if (name) farmerUpdates.name = name;
          if (phone !== undefined) farmerUpdates.phone = phone;
          if (address) farmerUpdates.address = address;
          if (soil_type) farmerUpdates.soil_type = soil_type;
          if (total_acreage) farmerUpdates.total_acreage = Number(total_acreage);
          if (land_parcels !== undefined) farmerUpdates.land_parcels = land_parcels;
          if (past_yield_history) farmerUpdates.past_yield_history = past_yield_history;
          updatedFarmer = FarmerModel.update(farmer.id, farmerUpdates);
        }
      }

      // 3. If Processor, update application or processor entity
      let updatedApp = null;
      if (targetUser.role === 'processor') {
        const app = ApplicationModel.findByUserId(targetUser.id) || ApplicationModel.findByEmail(targetUser.email);
        if (app) {
          updatedApp = ApplicationModel.updateStatus(app.id, app.status, 'Profile updated by user');
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Profile information updated successfully',
        user: {
          ...updatedUser,
          farmer_profile: updatedFarmer,
          provider_app: updatedApp
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleService(req, res, next) {
    try {
      const { user_id, email, is_service_active } = req.body;

      let user = null;
      if (user_id) user = UserModel.findById(user_id);
      else if (email) user = UserModel.format(UserModel.findByEmail(email));

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const active = is_service_active !== undefined ? Boolean(is_service_active) : !user.service_status;

      // Update in users table
      UserModel.update(user.id, { service_status: active ? 1 : 0 });

      // If farmer, also update in farmers table
      if (user.role === 'farmer') {
        const farmer = FarmerModel.findByUserId(user.id) || FarmerModel.findByEmail(user.email);
        if (farmer) {
          FarmerModel.update(farmer.id, { is_service_active: active ? 1 : 0 });
        }
      }

      // If processor, also update in processors table
      if (user.role === 'processor') {
        const proc = ProcessorModel.findByUserId(user.id);
        if (proc) {
          ProcessorModel.update(proc.id, { is_service_active: active ? 1 : 0 });
        }
      }

      return res.status(200).json({
        success: true,
        service_status: active,
        message: `Service status updated to ${active ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}`
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyFarmProfile(req, res, next) {
    return AuthController.updateProfile(req, res, next);
  }

  static async listUsers(req, res, next) {
    try {
      const roleFilter = req.query.role;
      const users = roleFilter ? UserModel.findByRole(roleFilter) : UserModel.findAll();
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestAccess(req, res, next) {
    try {
      const { user_id, email, requested_role, notes, company_name, gst_number, fssai_license, farm_address } = req.body;
      
      let user = null;
      if (user_id) {
        user = UserModel.findById(user_id);
      } else if (email) {
        const raw = UserModel.findByEmail(email);
        if (raw) user = UserModel.findById(raw.id);
      }

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // If user already has active access (farmer, processor, admin), reject duplicate requests
      if (['farmer', 'processor', 'admin'].includes(user.role)) {
        return res.status(400).json({
          success: false,
          error: `Your account already has active ${user.role === 'farmer' ? 'Cultivator Farmer' : user.role === 'processor' ? 'Bulk Consumer' : 'Admin'} access. Each account is limited to one designated role.`
        });
      }

      // If user already requested access, reject duplicate requests
      if (user.requested_role) {
        return res.status(400).json({
          success: false,
          error: `You have already submitted an access request for ${user.requested_role === 'farmer' ? 'Cultivator Farmer' : 'Bulk Consumer'} access. Please wait for Platform Admin approval.`
        });
      }

      if (!['farmer', 'processor'].includes(requested_role)) {
        return res.status(400).json({ success: false, error: 'requested_role must be farmer or processor' });
      }

      const now = new Date().toISOString();
      const updatedUser = UserModel.update(user.id, {
        requested_role,
        requested_at: now
      });

      if (requested_role === 'processor') {
        const existingApp = ApplicationModel.findByEmail(user.email);
        if (!existingApp) {
          ApplicationModel.create({
            user_id: user.id,
            user_email: user.email,
            company_name: company_name || `${user.name} Consumer Enterprise`,
            phone: user.phone || '+91-98765-43210',
            gst_number: gst_number || '03AABCA1234F1Z8',
            fssai_license: fssai_license || '10019011000123',
            address: farm_address || 'Industrial Agro Processing Hub, Punjab',
            latitude: 30.9010,
            longitude: 75.8573,
            processing_capacity_tons: 500,
            target_crops: 'Wheat, Potato, Soybean'
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: `Your request for ${requested_role === 'processor' ? 'Bulk Consumer' : 'Cultivator Farmer'} access has been submitted to the Platform Administrator for verification.`,
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
}
