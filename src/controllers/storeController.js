import { StoreModel } from '../models/storeModel.js';
import { FarmerModel } from '../models/farmerModel.js';
import { OrderModel } from '../models/orderModel.js';
import { ProcessorModel } from '../models/processorModel.js';
import { ContractService } from '../services/contractService.js';

export class StoreController {
  static async getFarmerStore(req, res, next) {
    try {
      const { id } = req.params;
      const farmer = FarmerModel.findById(id);
      if (!farmer) {
        return res.status(404).json({
          success: false,
          error: `Farmer with ID ${id} not found`
        });
      }

      const items = StoreModel.findByFarmerId(id);
      const totalQuintals = items.reduce((acc, it) => acc + (it.status === 'available' ? it.quantity_quintals : 0), 0);
      const totalInventoryValue = items.reduce((acc, it) => acc + (it.status === 'available' ? it.total_value_inr : 0), 0);

      return res.status(200).json({
        success: true,
        farmer: {
          id: farmer.id,
          name: farmer.name,
          location: farmer.location,
          is_service_active: farmer.is_service_active
        },
        stats: {
          total_items: items.length,
          available_quintals: totalQuintals,
          total_inventory_value_inr: totalInventoryValue
        },
        data: items
      });
    } catch (error) {
      next(error);
    }
  }

  static async addItemToStore(req, res, next) {
    try {
      const { id } = req.params; // farmer_id
      const {
        crop_name,
        grade,
        quantity_quintals,
        price_per_quintal,
        storage_type,
        harvest_date,
        moisture_percentage,
        soil_type,
        notes
      } = req.body;

      if (!crop_name || !quantity_quintals || !price_per_quintal) {
        return res.status(400).json({
          success: false,
          error: 'Crop name, quantity in Quintals, and price in ₹ per Quintal are required'
        });
      }

      if (Number(quantity_quintals) <= 0 || Number(price_per_quintal) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity and price must be positive numbers'
        });
      }

      const farmer = FarmerModel.findById(id);
      if (!farmer) {
        return res.status(404).json({
          success: false,
          error: `Farmer with ID ${id} not found`
        });
      }

      const item = StoreModel.create({
        farmer_id: id,
        crop_name,
        grade: grade || 'Grade A',
        quantity_quintals: Number(quantity_quintals),
        price_per_quintal: Number(price_per_quintal),
        storage_type: storage_type || 'Farm Silo',
        harvest_date: harvest_date || new Date().toISOString().split('T')[0],
        moisture_percentage: moisture_percentage ? Number(moisture_percentage) : 11.5,
        local_names: req.body.local_names || '',
        soil_type: soil_type || farmer.soil_type || 'Loamy',
        status: 'available',
        notes
      });

      return res.status(201).json({
        success: true,
        message: `Added ${quantity_quintals} Quintals of ${crop_name} to store at ₹${price_per_quintal}/Quintal`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStoreItem(req, res, next) {
    try {
      const { item_id } = req.params;
      const item = StoreModel.findById(item_id);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: `Store item with ID ${item_id} not found`
        });
      }

      const updated = StoreModel.update(item_id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Store item updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStoreItem(req, res, next) {
    try {
      const { item_id } = req.params;
      const item = StoreModel.findById(item_id);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: `Store item with ID ${item_id} not found`
        });
      }

      StoreModel.delete(item_id);
      return res.status(200).json({
        success: true,
        message: 'Item removed from store inventory'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMarketplace(req, res, next) {
    try {
      const { crop, max_price, storage_type, status } = req.query;
      const items = StoreModel.findAll({
        crop,
        maxPrice: max_price,
        storageType: storage_type,
        status: status || 'available'
      });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error) {
      next(error);
    }
  }

  // Create Order/Trade Request on Store Item
  static async createTradeRequest(req, res, next) {
    try {
      const {
        store_item_id,
        buyer_user_id,
        buyer_name,
        buyer_email,
        buyer_role = 'processor',
        quantity_quintals,
        offered_price_per_quintal,
        notes
      } = req.body;

      // 1. Check if user is a visitor: Visitors CANNOT order material
      if (buyer_role === 'visitor') {
        return res.status(403).json({
          success: false,
          error: 'Visitor accounts are in Explore-Only Mode. You can view all platform materials, but ordering produce requires a verified Farmer or Processor account authorized by Admin.'
        });
      }

      const item = StoreModel.findById(store_item_id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Store item not found' });
      }

      // 2. Check if farmer has Services ON or OFF
      const farmer = FarmerModel.findById(item.farmer_id);
      if (farmer && farmer.is_service_active === false) {
        return res.status(400).json({
          success: false,
          error: `Farmer ${farmer.name} has temporarily turned services OFF and is not accepting trade orders at this time.`
        });
      }

      const order = OrderModel.create({
        store_item_id,
        farmer_id: item.farmer_id,
        buyer_user_id,
        buyer_name: buyer_name || 'Agro Processor Sourcing Desk',
        buyer_email: buyer_email || 'buyer@agriproc.in',
        buyer_role,
        crop_name: item.crop_name,
        quantity_quintals: Number(quantity_quintals) || item.quantity_quintals,
        offered_price_per_quintal: Number(offered_price_per_quintal) || item.price_per_quintal,
        notes
      });

      // Automatically generate a smart legal contract for this trade dispatch
      let contract = null;
      try {
        let processor = null;
        if (buyer_user_id) {
          processor = ProcessorModel.findByUserId(buyer_user_id);
        }
        if (!processor && buyer_email) {
          const allProcessors = ProcessorModel.findAll();
          processor = allProcessors.find((p) => p.user_id === buyer_user_id || p.company_name === buyer_name);
        }
        if (!processor) {
          const allProcessors = ProcessorModel.findAll();
          processor = allProcessors[0];
        }

        if (processor) {
          const qtyQuintals = Number(quantity_quintals) || item.quantity_quintals;
          const ratePerQuintal = Number(offered_price_per_quintal) || item.price_per_quintal;
          const quantityTons = Math.max(1, Math.round(qtyQuintals / 10));
          const totalAgreed = qtyQuintals * ratePerQuintal;

          contract = ContractService.generateContract({
            processor_id: processor.id,
            farmer_id: item.farmer_id,
            agreed_price: totalAgreed,
            quantity: quantityTons,
            crop: item.crop_name,
            delivery_date: 'Within 30 days of trade dispatch'
          });
        }
      } catch (ctrErr) {
        console.warn('Notice: Direct contract generation bypassed:', ctrErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Material procurement request submitted to farmer and legal contract generated',
        data: order,
        contract_id: contract ? contract.id : null
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFarmerRequests(req, res, next) {
    try {
      const { farmer_id } = req.params;
      const requests = OrderModel.findByFarmerId(farmer_id);
      return res.status(200).json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  static async serveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const order = OrderModel.findById(id);
      if (!order) return res.status(404).json({ success: false, error: 'Request not found' });

      // Check farmer service
      const farmer = FarmerModel.findById(order.farmer_id);
      if (farmer && farmer.is_service_active === false) {
        return res.status(400).json({
          success: false,
          error: 'Cannot serve requests while farming service is turned OFF.'
        });
      }

      const updated = OrderModel.serve(id);
      return res.status(200).json({
        success: true,
        message: 'Trade request served and accepted by farmer',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { reason = 'Order declined by farmer' } = req.body;
      const order = OrderModel.findById(id);
      if (!order) return res.status(404).json({ success: false, error: 'Request not found' });

      const updated = OrderModel.cancel(id, reason);
      return res.status(200).json({
        success: true,
        message: 'Trade request cancelled by farmer',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
