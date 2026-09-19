import { ApplicationModel } from '../models/applicationModel.js';
import { UserModel } from '../models/userModel.js';

export class ProviderController {
  static async apply(req, res, next) {
    try {
      const {
        company_name,
        user_email,
        phone,
        gst_number,
        fssai_license,
        address,
        latitude,
        longitude,
        processing_capacity_tons,
        target_crops
      } = req.body;

      if (!company_name || !user_email) {
        return res.status(400).json({
          success: false,
          error: 'Company name and contact email are required'
        });
      }

      // Check if user exists
      const user = UserModel.findByEmail(user_email);

      // Check if user already has a pending application
      const existing = ApplicationModel.findByEmail(user_email);
      if (existing && existing.status === 'pending') {
        return res.status(409).json({
          success: false,
          error: 'You already have an active application awaiting administrator approval'
        });
      }

      const application = ApplicationModel.create({
        user_id: user ? user.id : null,
        user_email,
        company_name,
        phone,
        gst_number,
        fssai_license,
        address,
        latitude: latitude || 30.9010,
        longitude: longitude || 75.8573,
        processing_capacity_tons: processing_capacity_tons || 500,
        target_crops: target_crops || 'Wheat, Potato, Soybean'
      });

      if (user) {
        UserModel.update(user.id, {
          requested_role: 'processor',
          requested_at: new Date().toISOString()
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Provider application submitted successfully. It has been routed to the Platform Administrator for verification.',
        application
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyApplication(req, res, next) {
    try {
      const email = req.query.email || req.headers['x-user-email'];
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email parameter is required'
        });
      }

      const application = ApplicationModel.findByEmail(email);
      return res.status(200).json({
        success: true,
        application: application || null
      });
    } catch (error) {
      next(error);
    }
  }
}
