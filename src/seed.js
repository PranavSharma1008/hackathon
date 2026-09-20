import { getDb } from './db/connection.js';
import { FarmerModel } from './models/farmerModel.js';
import { ProcessorModel } from './models/processorModel.js';
import { ContractModel } from './models/contractModel.js';
import { DeliveryModel } from './models/deliveryModel.js';
import { mockFarmers, mockProcessors, mockContracts, mockDeliveries } from './data/mockData.js';

export function seedDatabase({ force = false } = {}) {
  const db = getDb();

  const farmerCount = FarmerModel.count();
  const processorCount = ProcessorModel.count();

  if (!force && farmerCount > 0 && processorCount > 0) {
    console.log(`[Seed] Database already contains ${farmerCount} farmers and ${processorCount} processors. Skipping seed.`);
    return {
      seeded: false,
      farmers: farmerCount,
      processors: processorCount,
      contracts: ContractModel.count(),
      deliveries: DeliveryModel.count()
    };
  }

  console.log('[Seed] Seeding database with fresh mock data...');

  if (force) {
    db.exec('DELETE FROM farmer_store_items;');
    db.exec('DELETE FROM processor_applications;');
    db.exec('DELETE FROM deliveries;');
    db.exec('DELETE FROM contracts;');
    db.exec('DELETE FROM farmers;');
    db.exec('DELETE FROM processors;');
    db.exec('DELETE FROM users;');
  }

  // 1. Seed Users FIRST so foreign keys referencing users(id) are satisfied
  db.exec('DELETE FROM users;');
  const stmtUser = db.prepare(`
    INSERT INTO users (id, email, password, name, phone, role, is_trusted_processor, service_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();

  // Admin Account (Specified by user: codekalesh@gmail.com / codekalesh@gmail.com)
  stmtUser.run(
    'user_admin_01',
    'codekalesh@gmail.com',
    'codekalesh@gmail.com',
    'Super Admin',
    '+91-98760-00001',
    'admin',
    1,
    1,
    now
  );

  // Farmer Account Kartikey (kartikey@gmail.com / kartikey@gmail.com)
  stmtUser.run(
    'user_kartikey',
    'kartikey@gmail.com',
    'kartikey@gmail.com',
    'Kartikey',
    '+91-98765-11223',
    'farmer',
    0,
    1,
    now
  );

  // Standard Farmer Users (Each farmer has their own secured account)
  for (const farmer of mockFarmers) {
    if (farmer.email && farmer.user_id && farmer.user_id !== 'user_kartikey') {
      stmtUser.run(
        farmer.user_id,
        farmer.email,
        'kisan123',
        farmer.name,
        farmer.phone,
        'farmer',
        0,
        1,
        now
      );
    }
  }

  // Verified Trusted Processor User (Duwarka Agro Mills)
  stmtUser.run(
    'user_duwarka',
    'duwarka@gmail.com',
    'duwarka@gmail.com',
    'Duwarka Agro Mills & Food Processing Pvt Ltd',
    '+91-98765-00001',
    'processor',
    1,
    1,
    now
  );

  // Verified Trusted Processor User (AgroPure)
  stmtUser.run(
    'user_proc_agropure',
    'procurement@agropure.com',
    'processor123',
    'AgroPure Foods Procurement',
    '+91-98900-11223',
    'processor',
    1,
    1,
    now
  );

  // Sample Visitor / Explorer User (Can view all, but cannot order or create contracts)
  stmtUser.run(
    'user_visitor_01',
    'visitor@punjabagro.org',
    'visitor123',
    'Simran Kaur (Observer)',
    '+91-98155-22334',
    'visitor',
    0,
    1,
    now
  );

  // 2. Seed Processors
  for (const proc of mockProcessors) {
    ProcessorModel.create(proc);
  }

  // 3. Seed Farmers
  for (const farmer of mockFarmers) {
    FarmerModel.create(farmer);
  }

  // 4. Seed Contracts
  for (const contract of mockContracts) {
    ContractModel.create(contract);
  }

  // 5. Seed Deliveries
  for (const delivery of mockDeliveries) {
    DeliveryModel.create(delivery);
  }

  // 6. Seed Sample Processor Applications
  db.exec('DELETE FROM processor_applications;');
  const stmtApp = db.prepare(`
    INSERT INTO processor_applications (
      id, user_id, user_email, company_name, phone, gst_number, fssai_license,
      address, latitude, longitude, processing_capacity_tons, target_crops,
      status, admin_notes, created_at, reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Pending application for admin to review and approve!
  stmtApp.run(
    'app_pending_01',
    null,
    'procurement@malwaagro.in',
    'Malwa Agri-Foods Processing Corp',
    '+91-98111-55443',
    '03AAECM4589K1Z4',
    '10022011000492',
    'Industrial Focal Point, Phase 4, Bathinda, Punjab',
    30.2110,
    74.9455,
    850,
    'Wheat, Mustard, Cotton',
    'pending',
    null,
    now,
    null
  );

  // Already approved trusted processor application
  stmtApp.run(
    'app_approved_01',
    'user_proc_agropure',
    'procurement@agropure.com',
    'AgroPure Flour Mills & Foods Ltd',
    '+91-98900-11223',
    '03AABCA1234F1Z8',
    '10019011000123',
    'Industrial Focal Point, Ludhiana, Punjab',
    30.9010,
    75.8573,
    1200,
    'Wheat, Soybean',
    'approved',
    'Verified by Admin (codekalesh@gmail.com). Enterprise verified with APMC compliance.',
    now,
    now
  );

  // 7. Seed Farmer Store Items (Stored produce with prices in ₹/Quintal)
  const SAMPLE_ASSAY_PDF = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCAxNzAKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgoxMDAgNzAwIFRkCihPRkZJQ0lBTCBTT0lMICAmIENST1AgUVVBTElUWSBBU1NBWSBSRVBPUlQpIFRqCi9GMSAxMiBUZgowIC0zMCBUZAooQ2VydGlmaWVkIGJ5IFN0YXRlIEFwbWMgTWFuZGkgTGFiKSBUagowIC0yMCBUZAooU3RhdHVzOiBBcHByb3ZlZCAmIENvbXBsaWFudCB3aXRoIEZTQ0FJIC8gSVNPIFN0YW5kYXJkcykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE4IDAwMDAwIG4gCjAwMDAwMDAwNzcgMDAwMDAgbiAKMDAwMDAwMDEzMyAwMDAwMCBuIAowMDAwMDAwMjgxIDAwMDAwIG4gCjAwMDAwMDA1MDQgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo1ODYKJSVFT0YK';

  db.exec('DELETE FROM farmer_store_items;');
  const stmtStore = db.prepare(`
    INSERT INTO farmer_store_items (
      id, farmer_id, crop_name, grade, quantity_quintals, price_per_quintal,
      storage_type, harvest_date, moisture_percentage, local_names, soil_type,
      report_document, report_file_name, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialStoreItems = [
    {
      id: 'store_item_01',
      farmer_id: 'farm_rajesh_01',
      crop_name: 'Sharbati Wheat',
      grade: 'Grade A',
      quantity_quintals: 450,
      price_per_quintal: 2450, // ₹2,450 / Qtl
      storage_type: 'Farm Silo',
      harvest_date: '2026-08-15',
      moisture_percentage: 11.2,
      local_names: 'gehun, kanak, sharbati, wheat',
      soil_type: 'Loamy',
      report_document: SAMPLE_ASSAY_PDF,
      report_file_name: 'APMC_Khanna_Wheat_Assay_Cert.pdf',
      status: 'available',
      notes: 'Clean golden grain, zero weed seeds, stored in temperature-controlled metal silo.'
    },
    {
      id: 'store_item_02',
      farmer_id: 'farm_rajesh_01',
      crop_name: 'Basmati Rice (Pusa 1121)',
      grade: 'Premium Mandi',
      quantity_quintals: 320,
      price_per_quintal: 3950, // ₹3,950 / Qtl
      storage_type: 'Mandi Warehouse',
      harvest_date: '2026-07-20',
      moisture_percentage: 12.0,
      local_names: 'chawal, dhan, basmati rice, pusa 1121',
      soil_type: 'Clay',
      status: 'available',
      notes: 'Extra long grain, moisture certified by Khanna APMC lab.'
    },
    {
      id: 'store_item_03',
      farmer_id: 'farm_gurpreet_02',
      crop_name: 'Potato (Kufri Chipsona)',
      grade: 'Grade A',
      quantity_quintals: 1200,
      price_per_quintal: 1550, // ₹1,550 / Qtl
      storage_type: 'Cold Storage',
      harvest_date: '2026-08-28',
      moisture_percentage: 14.5,
      local_names: 'aloo, batata, chipsona, alu',
      soil_type: 'Sandy Loam',
      status: 'available',
      notes: 'High dry-matter processing variety ideal for potato chips and snacks.'
    },
    {
      id: 'store_item_04',
      farmer_id: 'farm_gurpreet_02',
      crop_name: 'Yellow Corn / Maize',
      grade: 'Grade B',
      quantity_quintals: 300,
      price_per_quintal: 1980, // ₹1,980 / Qtl
      storage_type: 'Farm Silo',
      harvest_date: '2026-09-02',
      moisture_percentage: 12.5,
      local_names: 'makka, makki, yellow makka, yellow makki, bhutta, corn',
      soil_type: 'Loamy',
      status: 'available',
      notes: 'Uniform yellow grain, ideal for feed or starch processing.'
    },
    {
      id: 'store_item_05',
      farmer_id: 'farm_amitabh_03',
      crop_name: 'Soybean (JS 335)',
      grade: 'Grade A',
      quantity_quintals: 350,
      price_per_quintal: 4850, // ₹4,850 / Qtl
      storage_type: 'On-Farm Shed',
      harvest_date: '2026-08-10',
      moisture_percentage: 10.8,
      local_names: 'soya, soyabean, js 335, soybean',
      soil_type: 'Black',
      status: 'available',
      notes: 'High oil content seed, stored in moisture-proof HDPE bags.'
    },
    {
      id: 'store_item_06',
      farmer_id: 'farm_harpreet_05',
      crop_name: 'Sharbati Wheat',
      grade: 'Grade A',
      quantity_quintals: 750,
      price_per_quintal: 2420, // ₹2,420 / Qtl
      storage_type: 'Farm Silo',
      harvest_date: '2026-08-22',
      moisture_percentage: 11.0,
      local_names: 'gehun, kanak, organic wheat',
      soil_type: 'Alluvial',
      status: 'available',
      notes: 'Certified organic soil lineage, bulk discount negotiable for 500+ Quintals.'
    },
    {
      id: 'store_item_07',
      farmer_id: 'farm_vikram_06',
      crop_name: 'Mustard Seed (Sarson)',
      grade: 'Grade A',
      quantity_quintals: 180,
      price_per_quintal: 5450, // ₹5,450 / Qtl
      storage_type: 'On-Farm Shed',
      harvest_date: '2026-08-05',
      moisture_percentage: 8.2,
      local_names: 'sarson, rai, peeli sarson, mustard',
      soil_type: 'Sandy Loam',
      status: 'available',
      notes: 'High pungency, 41% oil extraction potential.'
    },
    {
      id: 'store_item_kartikey_01',
      farmer_id: 'farm_kartikey',
      crop_name: 'Yellow Corn / Maize',
      grade: 'Grade A',
      quantity_quintals: 200,
      price_per_quintal: 2450,
      storage_type: 'Farm Silo',
      harvest_date: '2026-09-19',
      moisture_percentage: 11.2,
      local_names: 'makka, makki, yellow makka, yellow makki, bhutta',
      soil_type: 'Loamy',
      status: 'available',
      notes: 'Premium harvest, stored in clean hermetic condition.'
    }
  ];

  for (const item of initialStoreItems) {
    stmtStore.run(
      item.id,
      item.farmer_id,
      item.crop_name,
      item.grade,
      item.quantity_quintals,
      item.price_per_quintal,
      item.storage_type,
      item.harvest_date,
      item.moisture_percentage,
      item.local_names || '',
      item.soil_type || 'Loamy',
      item.report_document || SAMPLE_ASSAY_PDF,
      item.report_file_name || `${item.crop_name.replace(/[^a-zA-Z0-9]/g, '_')}_Assay_Certificate.pdf`,
      item.status,
      item.notes,
      now,
      now
    );
  }

  console.log(`[Seed] Successfully seeded:
  - ${mockProcessors.length} Processors
  - ${mockFarmers.length} Farmers
  - ${mockContracts.length} Contracts
  - ${mockDeliveries.length} Deliveries
  - 3 Users (Admin: codekalesh@gmail.com, Farmer, Processor)
  - 2 Processor Applications (1 Pending, 1 Approved)
  - ${initialStoreItems.length} Farmer Store Items with ₹/Quintal rates`);

  return {
    seeded: true,
    farmers: mockFarmers.length,
    processors: mockProcessors.length,
    contracts: mockContracts.length,
    deliveries: mockDeliveries.length,
    users: 3,
    applications: 2,
    store_items: initialStoreItems.length
  };
}

// Allow direct execution via `node src/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  try {
    seedDatabase({ force: true });
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
}
