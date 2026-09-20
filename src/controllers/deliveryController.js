import { DeliveryModel } from '../models/deliveryModel.js';
import { ContractModel } from '../models/contractModel.js';

export class DeliveryController {
  /**
   * PUT /api/deliveries/track
   * Updates delivery milestones against the contract.
   * Accepts delivery_id or contract_id, updates status, and appends checkpoint notes.
   */
  static async trackDelivery(req, res, next) {
    try {
      const {
        delivery_id,
        contract_id,
        status,
        delivery_date,
        checkpoint,
        notes
      } = req.body;

      if (!delivery_id && !contract_id) {
        return res.status(400).json({
          success: false,
          error: 'Either delivery_id or contract_id must be provided to track delivery milestones'
        });
      }

      let delivery = null;

      if (delivery_id) {
        delivery = DeliveryModel.findById(delivery_id);
        if (!delivery) {
          return res.status(404).json({
            success: false,
            error: `Delivery with ID '${delivery_id}' not found`
          });
        }
      } else if (contract_id) {
        // Find existing delivery for this contract
        const existingList = DeliveryModel.findByContractId(contract_id);
        if (existingList.length > 0) {
          delivery = existingList[0];
        } else {
          // Verify contract exists before auto-scheduling
          const contract = ContractModel.findById(contract_id);
          if (!contract) {
            return res.status(404).json({
              success: false,
              error: `Contract with ID '${contract_id}' not found`
            });
          }

          // Initialize new delivery if none exists yet
          delivery = DeliveryModel.create({
            contract_id,
            status: status || 'Scheduled',
            delivery_date: delivery_date || new Date().toISOString().split('T')[0],
            checkpoint: checkpoint || 'Delivery pipeline initiated',
            notes: notes || 'First milestone recorded'
          });

          return res.status(200).json({
            success: true,
            message: 'Delivery record created and tracked for contract',
            data: delivery
          });
        }
      }

      // Update delivery milestone
      const updatedDelivery = DeliveryModel.updateMilestone(delivery.id, {
        status,
        delivery_date,
        checkpoint,
        notes
      });

      return res.status(200).json({
        success: true,
        message: `Delivery milestone successfully updated to '${updatedDelivery.status}'`,
        contract_fulfilled: updatedDelivery.status === 'Delivered',
        data: updatedDelivery
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/deliveries - Schedule a new delivery for a contract
   */
  static async createDelivery(req, res, next) {
    try {
      const { contract_id, status, delivery_date, checkpoint, notes } = req.body;

      if (!contract_id) {
        return res.status(400).json({ success: false, error: 'contract_id is required' });
      }

      const delivery = DeliveryModel.create({
        contract_id,
        status: status || 'Scheduled',
        delivery_date,
        checkpoint,
        notes
      });

      return res.status(201).json({
        success: true,
        message: 'Delivery scheduled successfully',
        data: delivery
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/deliveries - List all deliveries
   */
  static async getDeliveries(req, res, next) {
    try {
      const { status, contract_id } = req.query;

      let deliveries;
      if (contract_id) {
        deliveries = DeliveryModel.findByContractId(contract_id);
      } else {
        deliveries = DeliveryModel.findAll({ status });
      }

      return res.status(200).json({
        success: true,
        count: deliveries.length,
        data: deliveries
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/deliveries/:id - Get delivery details
   */
  static async getDeliveryById(req, res, next) {
    try {
      const { id } = req.params;
      const delivery = DeliveryModel.findById(id);

      if (!delivery) {
        return res.status(404).json({ success: false, error: `Delivery with ID '${id}' not found` });
      }

      return res.status(200).json({
        success: true,
        data: delivery
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/deliveries/:id/location - Update GPS telemetry
   */
  static async updateLocation(req, res, next) {
    try {
      const { id } = req.params;
      const { latitude, longitude, checkpoint, speed_kmh, eta_minutes, notes } = req.body;
      const delivery = DeliveryModel.findById(id);
      if (!delivery) {
        return res.status(404).json({ success: false, error: `Delivery '${id}' not found` });
      }

      const updated = DeliveryModel.updateLocation(id, {
        latitude,
        longitude,
        checkpoint,
        speedKmh: speed_kmh,
        etaMinutes: eta_minutes,
        notes
      });

      return res.status(200).json({
        success: true,
        message: 'GPS telemetry and dispatch location updated',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/deliveries/:id/advance-step - Advance dispatch truck to next checkpoint along route
   */
  static async advanceStep(req, res, next) {
    try {
      const { id } = req.params;
      const delivery = DeliveryModel.findById(id);
      if (!delivery) {
        return res.status(404).json({ success: false, error: `Delivery '${id}' not found` });
      }

      const updated = DeliveryModel.advanceLocationStep(id);

      return res.status(200).json({
        success: true,
        message: `Shipment advanced to checkpoint: ${updated.current_checkpoint}`,
        contract_fulfilled: updated.status === 'Delivered',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
