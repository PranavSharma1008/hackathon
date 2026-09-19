import { ProcessorModel } from '../models/processorModel.js';
import { FarmerModel } from '../models/farmerModel.js';
import { MatchingService } from '../services/matchingService.js';

export class MatchController {
  /**
   * GET /api/match/:processor_id
   * AI Matching Engine: calculates compatibility score between processor demand
   * and nearby farms based on soil, season, and past yield, returning a ranked list.
   */
  static async getMatches(req, res, next) {
    try {
      const { processor_id } = req.params;
      const includeOutOfRadius = req.query.include_out_of_radius !== 'false';
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

      const processor = ProcessorModel.findById(processor_id);
      if (!processor) {
        return res.status(404).json({
          success: false,
          error: `Processor demand with ID '${processor_id}' not found`
        });
      }

      const farmers = FarmerModel.findAll();
      if (farmers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No registered farmers found in database to evaluate',
          processor_demand: processor,
          total_candidates_evaluated: 0,
          matches: []
        });
      }

      let rankedMatches = MatchingService.calculateMatches(processor, farmers, {
        includeOutOfRadius
      });

      if (limit && !isNaN(limit) && limit > 0) {
        rankedMatches = rankedMatches.slice(0, limit);
      }

      return res.status(200).json({
        success: true,
        processor_demand: {
          id: processor.id,
          company_name: processor.company_name,
          required_crop: processor.required_crop,
          required_grade: processor.required_grade,
          quantity_needed_tons: processor.quantity_needed_tons,
          max_distance_km: processor.max_distance_km,
          deadline: processor.deadline,
          location: processor.location
        },
        engine_metadata: {
          algorithm: 'Multi-Factor Agronomic AI Matchmaker v1.0',
          evaluation_criteria: [
            'Geographic Haversine Distance (25%)',
            'Soil Agronomic Compatibility (25%)',
            'Historical Yield & Quality Grade Track Record (30%)',
            'Acreage Capacity & Seasonal Window (20%)'
          ],
          total_candidates_evaluated: farmers.length,
          matched_count: rankedMatches.length
        },
        matches: rankedMatches
      });
    } catch (error) {
      next(error);
    }
  }
}
