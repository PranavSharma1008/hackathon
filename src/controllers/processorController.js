import { ProcessorModel } from '../models/processorModel.js';

export class ProcessorController {
  /**
   * POST /api/processors - Post processor crop demand
   */
  static async createProcessor(req, res, next) {
    try {
      const {
        company_name,
        location,
        latitude,
        longitude,
        address,
        required_crop,
        required_grade,
        quantity_needed_tons,
        max_distance_km,
        deadline,
        target_price_per_ton
      } = req.body;

      if (!company_name) {
        return res.status(400).json({ success: false, error: 'company_name is required' });
      }

      const lat = location?.latitude ?? latitude;
      const lon = location?.longitude ?? longitude;

      if (lat === undefined || lon === undefined || lat === null || lon === null) {
        return res.status(400).json({
          success: false,
          error: 'Processor location coordinates (latitude and longitude) are required'
        });
      }

      if (!required_crop) {
        return res.status(400).json({ success: false, error: 'required_crop is required' });
      }

      if (!required_grade) {
        return res.status(400).json({ success: false, error: 'required_grade is required (e.g. Grade A)' });
      }

      if (!quantity_needed_tons || Number(quantity_needed_tons) <= 0) {
        return res.status(400).json({ success: false, error: 'quantity_needed_tons must be a positive number' });
      }

      if (!max_distance_km || Number(max_distance_km) <= 0) {
        return res.status(400).json({ success: false, error: 'max_distance_km must be a positive number' });
      }

      if (!deadline) {
        return res.status(400).json({ success: false, error: 'deadline date is required (e.g. 2026-11-30)' });
      }

      const processor = ProcessorModel.create({
        company_name,
        location: {
          latitude: Number(lat),
          longitude: Number(lon),
          address: location?.address || address || null
        },
        required_crop,
        required_grade,
        quantity_needed_tons: Number(quantity_needed_tons),
        max_distance_km: Number(max_distance_km),
        deadline,
        target_price_per_ton: target_price_per_ton ? Number(target_price_per_ton) : null
      });

      return res.status(201).json({
        success: true,
        message: 'Processor crop demand registered successfully',
        data: processor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/processors - List all processor demands
   */
  static async getProcessors(req, res, next) {
    try {
      const processors = ProcessorModel.findAll();
      return res.status(200).json({
        success: true,
        count: processors.length,
        data: processors
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/processors/:id - Get processor demand details
   */
  static async getProcessorById(req, res, next) {
    try {
      const { id } = req.params;
      const processor = ProcessorModel.findById(id);

      if (!processor) {
        return res.status(404).json({ success: false, error: `Processor demand with ID '${id}' not found` });
      }

      return res.status(200).json({
        success: true,
        data: processor
      });
    } catch (error) {
      next(error);
    }
  }
}
