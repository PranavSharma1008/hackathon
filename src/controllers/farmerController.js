import { FarmerModel } from '../models/farmerModel.js';

export class FarmerController {
  /**
   * POST /api/farmers - Register a farm
   */
  static async createFarmer(req, res, next) {
    try {
      const { name, location, latitude, longitude, address, soil_type, total_acreage, past_yield_history, phone } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Farmer name is required' });
      }

      const lat = location?.latitude ?? latitude;
      const lon = location?.longitude ?? longitude;

      if (lat === undefined || lon === undefined || lat === null || lon === null) {
        return res.status(400).json({
          success: false,
          error: 'Location coordinates (latitude and longitude) are required'
        });
      }

      if (!soil_type) {
        return res.status(400).json({ success: false, error: 'Soil type is required (e.g. Loamy, Sandy, Clay, Black)' });
      }

      if (!total_acreage || Number(total_acreage) <= 0) {
        return res.status(400).json({ success: false, error: 'Total acreage must be a positive number' });
      }

      const farmer = FarmerModel.create({
        name,
        location: {
          latitude: Number(lat),
          longitude: Number(lon),
          address: location?.address || address || null
        },
        soil_type,
        total_acreage: Number(total_acreage),
        past_yield_history: past_yield_history || [],
        phone
      });

      return res.status(201).json({
        success: true,
        message: 'Farm registered successfully',
        data: farmer
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/farmers - List all farmers
   */
  static async getFarmers(req, res, next) {
    try {
      const farmers = FarmerModel.findAll();
      return res.status(200).json({
        success: true,
        count: farmers.length,
        data: farmers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/farmers/:id - Get farmer details
   */
  static async getFarmerById(req, res, next) {
    try {
      const { id } = req.params;
      const farmer = FarmerModel.findById(id);

      if (!farmer) {
        return res.status(404).json({ success: false, error: `Farmer with ID '${id}' not found` });
      }

      return res.status(200).json({
        success: true,
        data: farmer
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/farmers/:id - Update farmer profile / land
   */
  static async updateFarmer(req, res, next) {
    try {
      const { id } = req.params;
      const existing = FarmerModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Farmer with ID '${id}' not found` });
      }

      const updated = FarmerModel.update(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Farmer profile and farmland specifications updated',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/farmers/:id/parcels - Update full list of land parcels
   */
  static async updateFarmerParcels(req, res, next) {
    try {
      const { id } = req.params;
      const { parcels } = req.body;

      if (!Array.isArray(parcels)) {
        return res.status(400).json({ success: false, error: 'Parcels array is required' });
      }

      const existing = FarmerModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Farmer with ID '${id}' not found` });
      }

      const updated = FarmerModel.update(id, { land_parcels: parcels });
      return res.status(200).json({
        success: true,
        message: 'Land parcels updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/farmers/:id/parcels - Add a new land parcel
   */
  static async addLandParcel(req, res, next) {
    try {
      const { id } = req.params;
      const { name, soil_type, acreage, address, irrigation_type, primary_crop, notes } = req.body;

      if (!soil_type || !acreage || Number(acreage) <= 0) {
        return res.status(400).json({ success: false, error: 'Soil type and positive acreage are required' });
      }

      const existing = FarmerModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Farmer with ID '${id}' not found` });
      }

      const newParcel = {
        id: `parcel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name || `Farmland Parcel #${(existing.land_parcels?.length || 0) + 1}`,
        soil_type: soil_type || 'Loamy',
        acreage: Number(acreage),
        address: address || existing.location?.address || 'Farmlands Cluster',
        irrigation_type: irrigation_type || 'Canal Irrigation',
        primary_crop: primary_crop || '',
        notes: notes || ''
      };

      const updatedParcels = [...(existing.land_parcels || []), newParcel];
      const updated = FarmerModel.update(id, { land_parcels: updatedParcels });

      return res.status(201).json({
        success: true,
        message: `Added new land parcel '${newParcel.name}' (${newParcel.acreage} Acres, ${newParcel.soil_type})`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/farmers/:id/parcels/:parcelId - Delete a land parcel
   */
  static async deleteLandParcel(req, res, next) {
    try {
      const { id, parcelId } = req.params;
      const existing = FarmerModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Farmer with ID '${id}' not found` });
      }

      const currentParcels = existing.land_parcels || [];
      if (currentParcels.length <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot delete the only registered land parcel. Update its details instead.' });
      }

      const filtered = currentParcels.filter((p) => p.id !== parcelId);
      if (filtered.length === currentParcels.length) {
        return res.status(404).json({ success: false, error: `Land parcel '${parcelId}' not found` });
      }

      const updated = FarmerModel.update(id, { land_parcels: filtered });
      return res.status(200).json({
        success: true,
        message: 'Land parcel removed successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
