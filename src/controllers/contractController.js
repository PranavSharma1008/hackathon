import { ContractService } from '../services/contractService.js';
import { ContractModel } from '../models/contractModel.js';
import { FarmerModel } from '../models/farmerModel.js';
import { ProcessorModel } from '../models/processorModel.js';
import { DeliveryModel } from '../models/deliveryModel.js';

export class ContractController {
  /**
   * POST /api/contracts/generate
   * AI Contract Generator: takes processor and farmer IDs, generates formal contract text.
   */
  static async generateContract(req, res, next) {
    try {
      const { processor_id, farmer_id, agreed_price, quantity, crop, delivery_date } = req.body;

      if (!processor_id) {
        return res.status(400).json({ success: false, error: 'processor_id is required' });
      }

      if (!farmer_id) {
        return res.status(400).json({ success: false, error: 'farmer_id is required' });
      }

      // Check if farmer service is ON / OFF
      const farmer = FarmerModel.findById(farmer_id);
      if (farmer && farmer.is_service_active === false) {
        return res.status(400).json({
          success: false,
          error: `Farmer ${farmer.name} has temporarily turned their services OFF and cannot receive contract requests at this time.`
        });
      }

      // Check if processor service is ON / OFF
      const processor = ProcessorModel.findById(processor_id);
      if (processor && processor.is_service_active === false) {
        return res.status(400).json({
          success: false,
          error: `Your Procurement Intake Service is currently OFF. Please turn your service ON before creating contract requests.`
        });
      }

      const contract = ContractService.generateContract({
        processor_id,
        farmer_id,
        agreed_price,
        quantity,
        crop,
        delivery_date
      });

      return res.status(201).json({
        success: true,
        message: 'Contract generated and registered successfully in Pending status',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/contracts - List all contracts
   */
  static async getContracts(req, res, next) {
    try {
      const { status, farmer_id, processor_id } = req.query;
      const contracts = ContractModel.findAll({ status, farmer_id, processor_id });

      return res.status(200).json({
        success: true,
        count: contracts.length,
        data: contracts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/contracts/:id - Get contract details
   */
  static async getContractById(req, res, next) {
    try {
      const { id } = req.params;
      const contract = ContractModel.findById(id);

      if (!contract) {
        return res.status(404).json({ success: false, error: `Contract with ID '${id}' not found` });
      }

      return res.status(200).json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/contracts/:id/sign - Sign a pending contract
   */
  static async signContract(req, res, next) {
    try {
      const { id } = req.params;
      const existing = ContractModel.findById(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: `Contract with ID '${id}' not found` });
      }

      const updated = ContractModel.updateStatus(id, 'Signed');

      return res.status(200).json({
        success: true,
        message: 'Contract signed successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/contracts/:id/serve - Serve/Accept request by farmer or processor
   */
  static async serveContract(req, res, next) {
    try {
      const { id } = req.params;
      const { served_by = 'farmer' } = req.body;
      const existing = ContractModel.findById(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: `Contract with ID '${id}' not found` });
      }

      // Check if farmer service is ON
      if (served_by === 'farmer') {
        const farmer = FarmerModel.findById(existing.farmer_id);
        if (farmer && farmer.is_service_active === false) {
          return res.status(400).json({
            success: false,
            error: 'Cannot serve request while your farming service is turned OFF. Turn service ON in your dashboard first.'
          });
        }
      }

      const updated = ContractModel.serve(id, served_by);

      return res.status(200).json({
        success: true,
        message: `Contract request served and accepted by ${served_by}`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/contracts/:id/cancel - Cancel/Decline request by farmer or processor
   */
  static async cancelContract(req, res, next) {
    try {
      const { id } = req.params;
      const { cancelled_by = 'farmer', reason = 'Request declined by user' } = req.body;
      const existing = ContractModel.findById(id);

      if (!existing) {
        return res.status(404).json({ success: false, error: `Contract with ID '${id}' not found` });
      }

      const updated = ContractModel.cancel(id, { cancelledBy: cancelled_by, reason });

      return res.status(200).json({
        success: true,
        message: `Contract request cancelled by ${cancelled_by}`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/contracts/:id/pay-advance - Consumer pays 30% advance escrow
   */
  static async payAdvance(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, payment_method = 'UPI', transaction_ref } = req.body;

      const existing = ContractModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: `Contract with ID '${id}' not found` });
      }

      const updatedContract = ContractModel.payAdvance(id, {
        amount,
        paymentMethod: payment_method,
        transactionRef: transaction_ref
      });

      // Auto-schedule and activate delivery tracking if not already created
      let deliveries = DeliveryModel.findByContractId(id);
      let delivery = deliveries[0];

      if (!delivery) {
        const farmer = FarmerModel.findById(existing.farmer_id);
        const fLat = farmer?.location?.latitude || 30.7046;
        const fLng = farmer?.location?.longitude || 75.8573;

        delivery = DeliveryModel.create({
          contract_id: id,
          status: 'In Transit',
          delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          checkpoint: '30% Advance Escrow Deposited - Produce Dispatched from Farm Gate',
          notes: `30% advance consideration (₹${updatedContract.advance_paid_amount.toLocaleString('en-IN')}) verified via ${payment_method}. Freight hauler dispatched from farm.`,
          current_latitude: fLat,
          current_longitude: fLng,
          current_checkpoint: 'Farm Gate Loading Bay, Punjab',
          driver_name: 'Jagtar Singh',
          driver_phone: '+91-98140-11223',
          vehicle_number: 'PB-10-AZ-9981',
          speed_kmh: 48.0,
          eta_minutes: 45
        });
      }

      return res.status(200).json({
        success: true,
        message: `30% Advance Escrow Payment of ₹${updatedContract.advance_paid_amount.toLocaleString('en-IN')} confirmed. Dispatch tracking activated.`,
        data: updatedContract,
        delivery
      });
    } catch (error) {
      next(error);
    }
  }
}
