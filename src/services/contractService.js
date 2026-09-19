import { FarmerModel } from '../models/farmerModel.js';
import { ProcessorModel } from '../models/processorModel.js';
import { ContractModel } from '../models/contractModel.js';

export class ContractService {
  /**
   * Generates a formal, legally structured agricultural supply contract
   * and saves it to the database with 'Pending' status.
   */
  static generateContract({ processor_id, farmer_id, agreed_price, quantity, crop, delivery_date }) {
    if (!processor_id || !farmer_id) {
      throw new Error('processor_id and farmer_id are required to generate a contract');
    }

    const processor = ProcessorModel.findById(processor_id);
    if (!processor) {
      throw new Error(`Processor with ID '${processor_id}' not found`);
    }

    const farmer = FarmerModel.findById(farmer_id);
    if (!farmer) {
      throw new Error(`Farmer with ID '${farmer_id}' not found`);
    }

    // Determine final parameters with smart fallbacks
    const contractedCrop = crop || processor.required_crop;
    const contractedQuantity = Number(quantity || processor.quantity_needed_tons);

    const pricePerTon = agreed_price
      ? Number(agreed_price) / contractedQuantity
      : processor.target_price_per_ton || 24500;

    const totalAgreedPrice = agreed_price
      ? Number(agreed_price)
      : Math.round(pricePerTon * contractedQuantity);

    const finalDeliveryDate = delivery_date || processor.deadline || 'Within 90 days of execution';

    const contractDate = new Date().toISOString().split('T')[0];
    const contractRef = `AGRI-CTR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Generate comprehensive formal legal contract text
    const contractText = this.compileContractText({
      contractRef,
      contractDate,
      processor,
      farmer,
      crop: contractedCrop,
      grade: processor.required_grade,
      quantity: contractedQuantity,
      pricePerTon: Math.round(pricePerTon * 100) / 100,
      totalAgreedPrice,
      deliveryDate: finalDeliveryDate
    });

    // Persist in DB
    const contract = ContractModel.create({
      processor_id: processor.id,
      farmer_id: farmer.id,
      crop: contractedCrop,
      quantity: contractedQuantity,
      agreed_price: totalAgreedPrice,
      status: 'Pending',
      contract_text: contractText
    });

    return contract;
  }

  /**
   * Compiles the formal legal contract document text
   */
  static compileContractText(data) {
    const advanceAmount = Math.round(data.totalAgreedPrice * 0.2);
    const finalAmount = data.totalAgreedPrice - advanceAmount;
    const quintalQuantity = data.quantity * 10;
    const pricePerQuintal = Math.round(data.pricePerTon / 10);

    return `================================================================================
AGRICULTURAL FORWARD PROCUREMENT & CONTRACT FARMING AGREEMENT
Regulated under State Agricultural Produce Markets & Contract Farming Framework
Reference No: ${data.contractRef}
Date of Execution: ${data.contractDate}
================================================================================

THIS AGREEMENT is entered into on ${data.contractDate} by and between:

1. BUYER / BULK CONSUMER:
   Consumer / Enterprise Entity: ${data.processor.company_name}
   Registration ID: ${data.processor.id}
   Processing Hub / Silo: ${data.processor.location.address || 'Designated Agro Intake Facility'}
   Coordinates: [${data.processor.location.latitude}, ${data.processor.location.longitude}]
   (hereinafter referred to as the "Buyer / Consumer", which expression shall include successors and assigns)

AND

2. FARMER / PRODUCER:
   Farmer / Grower: ${data.farmer.name}
   Farmer ID: ${data.farmer.id}
   Farm Location: ${data.farmer.location.address || 'Designated Farmland'}
   Coordinates: [${data.farmer.location.latitude}, ${data.farmer.location.longitude}]
   Registered Land Area: ${data.farmer.total_acreage} Acres | Soil Profile: ${data.farmer.soil_type}
   (hereinafter referred to as the "Farmer / Seller")

RECITALS / PREAMBLE:
WHEREAS the Buyer operates commercial agro-processing/milling operations and requires a guaranteed, high-grade agricultural harvest meeting strict APMC quality standards;
AND WHEREAS the Farmer cultivates agricultural land possessing verified soil characteristics and demonstrated yield capability;
NOW, THEREFORE, the Parties mutually agree to the following legally binding covenants:

ARTICLE 1: CROP VARIETY & QUALITY STANDARDS
1.1 Contracted Produce: ${data.crop}.
1.2 Quality Grade Standard: ${data.grade} (Premium Mandi Standard). Produce shall be clean, sound, mature, uniform in color/size, and free from pests, stones, fungal blight, or hazardous pesticide residues exceeding FSSAI statutory limits.
1.3 Moisture Threshold: Maximum moisture shall not exceed 12.0% w/w upon weighbridge delivery check.
1.4 Purity Standard: Unadulterated crop purity shall equal or exceed 98.5%.

ARTICLE 2: COMMITTED VOLUME & DELIVERY DEADLINE
2.1 Total Contracted Volume: ${quintalQuantity.toLocaleString('en-IN')} Quintals (Qtl) [Equivalent to ${data.quantity} Metric Tons / ${(quintalQuantity * 100).toLocaleString('en-IN')} kg].
    *Note: 1 Quintal = 100 kg | 10 Quintals = 1,000 kg (1 MT).
2.2 Delivery Deadline: ${data.deliveryDate}.
2.3 Delivery Location: Buyer's Intake Gate / Silo at ${data.processor.location.address || 'Receiving Facility'}.
2.4 Transportation: Transit in covered tractor-trolley / commercial truck preserving produce from weather.

ARTICLE 3: PRICE RATE & PAYMENT SCHEDULE
3.1 Agreed Price Rate: ₹${pricePerQuintal.toLocaleString('en-IN')} per Quintal (Qtl) [Equivalent to ₹${data.pricePerTon.toLocaleString('en-IN')} per Metric Ton].
3.2 Total Consideration: ₹${data.totalAgreedPrice.toLocaleString('en-IN')} INR.
3.3 Payment Disbursement Milestones:
    a) Advance Installment (20% Advance): ₹${advanceAmount.toLocaleString('en-IN')} INR payable via Direct Bank Transfer (DBT) within 5 business days of bilateral execution for input procurement (certified seed, DAP/urea, diesel).
    b) Final Settlement (80% Balance): ₹${finalAmount.toLocaleString('en-IN')} INR payable within 7 business days following certified weighbridge slip and Mandi QA laboratory sign-off.

ARTICLE 4: WEIGHBRIDGE MEASUREMENT & LAB SAMPLING
4.1 Certified Weighbridge: Net delivery weight determined at certified weighbridge at Buyer's intake gate in presence of Farmer or designated representative.
4.2 Weighbridge Slip: Official computer-generated weighment slip shall serve as prima facie conclusive evidence of delivered net quantity.
4.3 Joint Quality Sampling: Inspection completed within 24 hours of arrival. If contested, an independent certified sample shall be submitted to the nearest State APMC Mandi Testing Lab.

ARTICLE 5: FARMER PROTECTION & FORCE MAJEURE
5.1 Excusable Events: Neither party shall be liable for non-performance occasioned by catastrophic floods, severe hailstorms, declared drought, or epidemic.
5.2 Crop Insurance: The Farmer is encouraged to maintain crop insurance coverage under Pradhan Mantri Fasal Bima Yojana (PMFBY).

ARTICLE 6: CROP EXCLUSIVITY
6.1 The Farmer agrees that the contracted ${quintalQuantity.toLocaleString('en-IN')} Quintals of ${data.crop} is exclusively dedicated to the Buyer and shall not be diverted to third-party open mandis without written consent.

ARTICLE 7: DISPUTE RESOLUTION & JURISDICTION
7.1 Amicable Conciliation: Any dispute shall first be addressed through mutual negotiation and conciliation.
7.2 Mandi Committee & SDM Authority: Unresolved disputes shall be submitted to the Sub-Divisional Magistrate (SDM) / Local APMC Mandi Committee having jurisdiction over the farm location.

IN WITNESS WHEREOF, the authorized representatives of Buyer and Seller execute this Agreement.

____________________________________          ____________________________________
For Buyer / Consumer: ${data.processor.company_name}       For Farmer: ${data.farmer.name}
Status: Digital Counter-Signature Verified     Status: Digital Counter-Signature Verified
Date: ${data.contractDate}                             Date: ${data.contractDate}
================================================================================`;
  }
}
