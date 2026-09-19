/**
 * Realistic Mock Data for Contract Farming Matchmaker
 * Agricultural hub: Indo-Gangetic Plains / Punjab Agri-Cluster
 */

export const mockProcessors = [
  {
    id: 'proc_duwarka',
    user_id: 'user_duwarka',
    company_name: 'Duwarka Agro Mills & Food Processing Pvt Ltd',
    location: {
      latitude: 30.901,
      longitude: 75.8573,
      address: 'Agro Industrial Complex, Phase-2, Ludhiana, Punjab'
    },
    required_crop: 'Wheat',
    required_grade: 'Grade A',
    quantity_needed_tons: 50,
    max_distance_km: 100,
    deadline: '2026-11-30',
    target_price_per_ton: 25500 // ₹25,500/MT (₹2,550/quintal)
  },
  {
    id: 'proc_wheat_01',
    company_name: 'AgroPure Flour Mills & Foods Ltd',
    location: {
      latitude: 30.901,
      longitude: 75.8573,
      address: 'Industrial Focal Point, Ludhiana, Punjab'
    },
    required_crop: 'Wheat',
    required_grade: 'Grade A',
    quantity_needed_tons: 50,
    max_distance_km: 100,
    deadline: '2026-11-30',
    target_price_per_ton: 24500 // ₹24,500/MT (₹2,450/quintal)
  },
  {
    id: 'proc_potato_02',
    company_name: 'CrispyChip Snack Industries',
    location: {
      latitude: 31.326,
      longitude: 75.5762,
      address: 'Agro Processing Zone, Jalandhar, Punjab'
    },
    required_crop: 'Potato',
    required_grade: 'Grade A',
    quantity_needed_tons: 80,
    max_distance_km: 90,
    deadline: '2026-12-15',
    target_price_per_ton: 15000 // ₹15,000/MT (₹1,500/quintal)
  },
  {
    id: 'proc_soy_03',
    company_name: 'SunBio Protein Extracts Corp',
    location: {
      latitude: 30.3398,
      longitude: 76.3869,
      address: 'Patiala Industrial Belt, Punjab'
    },
    required_crop: 'Soybean',
    required_grade: 'Grade A',
    quantity_needed_tons: 40,
    max_distance_km: 120,
    deadline: '2026-11-10',
    target_price_per_ton: 49000 // ₹49,000/MT (₹4,900/quintal)
  }
];

export const mockFarmers = [
  {
    id: 'farm_kartikey',
    user_id: 'user_kartikey',
    email: 'kartikey@gmail.com',
    name: 'Kartikey',
    location: {
      latitude: 30.7046,
      longitude: 76.2215,
      address: 'Kisan Bio Agri Farm, Khanna Tehsil, Ludhiana, Punjab'
    },
    soil_type: 'Loamy',
    total_acreage: 45,
    land_parcels: [
      {
        id: 'parcel_kartikey_01',
        name: 'Main Bio Farm (Khanna Tehsil)',
        soil_type: 'Loamy',
        acreage: 25,
        address: 'Kisan Bio Agri Farm, Khanna Tehsil, Ludhiana, Punjab',
        irrigation_type: 'Canal & Tubewell',
        primary_crop: 'Wheat & Yellow Corn',
        ph_index: 6.8,
        organic_carbon: 1.24,
        nitrogen_kg_ha: 290,
        phosphorus_kg_ha: 22.4,
        notes: 'Optimal neutral pH, high organic carbon humus, APMC certified'
      },
      {
        id: 'parcel_kartikey_02',
        name: 'Canal Road Parcel (North Field)',
        soil_type: 'Sandy Loam',
        acreage: 20,
        address: 'Near Canal Bridge, Khanna, Ludhiana, Punjab',
        irrigation_type: 'Drip & Borewell',
        primary_crop: 'Potato (Kufri Chipsona)',
        ph_index: 6.2,
        organic_carbon: 0.95,
        nitrogen_kg_ha: 240,
        phosphorus_kg_ha: 31.2,
        notes: 'Loose sandy loam structure, optimal for root and tuber aeration'
      }
    ],
    past_yield_history: [
      { crop: 'Wheat', tons: 55, year: 2024, grade: 'Grade A' },
      { crop: 'Basmati Paddy', tons: 40, year: 2023, grade: 'Grade A' }
    ],
    phone: '+91-98765-11223'
  },
  {
    id: 'farm_rajesh_01',
    user_id: 'user_farmer_rajesh',
    email: 'rajesh.patel@kisan.in',
    name: 'Rajesh Patel',
    location: {
      latitude: 30.7073,
      longitude: 76.2167,
      address: 'GT Road Farmlands, Khanna, Punjab'
    },
    soil_type: 'Loamy',
    total_acreage: 65,
    land_parcels: [
      {
        id: 'parcel_rajesh_01',
        name: 'GT Road Agricultural Plot',
        soil_type: 'Loamy',
        acreage: 40,
        address: 'GT Road Farmlands, Khanna, Punjab',
        irrigation_type: 'Canal Irrigation',
        primary_crop: 'Sharbati Wheat',
        ph_index: 6.9,
        organic_carbon: 1.20,
        nitrogen_kg_ha: 285,
        phosphorus_kg_ha: 23.0,
        notes: 'High yield wheat soil'
      },
      {
        id: 'parcel_rajesh_02',
        name: 'South Agro Cluster (Black Soil Plot)',
        soil_type: 'Black',
        acreage: 25,
        address: 'Khanna South Bypass, Ludhiana, Punjab',
        irrigation_type: 'Borewell & Sprinkler',
        primary_crop: 'Soybean (JS 335)',
        ph_index: 7.7,
        organic_carbon: 1.15,
        nitrogen_kg_ha: 260,
        phosphorus_kg_ha: 20.5,
        notes: 'Deep clayey-black moisture-retentive soil'
      }
    ],
    past_yield_history: [
      { crop: 'Wheat', tons: 65, year: 2024, grade: 'Grade A' },
      { crop: 'Wheat', tons: 58, year: 2023, grade: 'Grade A' },
      { crop: 'Soybean', tons: 25, year: 2023, grade: 'Grade B' }
    ],
    phone: '+91-98765-43210'
  },
  {
    id: 'farm_gurpreet_02',
    user_id: 'user_farmer_gurpreet',
    email: 'gurpreet.singh@kisan.in',
    name: 'Gurpreet Singh',
    location: {
      latitude: 31.224,
      longitude: 75.7708,
      address: 'Phagwara Agri Cluster, Kapurthala, Punjab'
    },
    soil_type: 'Sandy Loam',
    total_acreage: 45,
    past_yield_history: [
      { crop: 'Potato', tons: 110, year: 2024, grade: 'Grade A' },
      { crop: 'Potato', tons: 95, year: 2023, grade: 'Grade A' },
      { crop: 'Corn', tons: 30, year: 2022, grade: 'Grade B' }
    ],
    phone: '+91-98123-45678'
  },
  {
    id: 'farm_amitabh_03',
    user_id: 'user_farmer_amitabh',
    email: 'amitabh.verma@kisan.in',
    name: 'Amitabh Verma',
    location: {
      latitude: 30.2458,
      longitude: 75.8421,
      address: 'Sangrur South Agricultural Belt, Punjab'
    },
    soil_type: 'Alluvial',
    total_acreage: 50,
    past_yield_history: [
      { crop: 'Wheat', tons: 45, year: 2024, grade: 'Grade B' },
      { crop: 'Soybean', tons: 35, year: 2023, grade: 'Grade A' },
      { crop: 'Rice', tons: 40, year: 2022, grade: 'Grade A' }
    ],
    phone: '+91-97654-32109'
  },
  {
    id: 'farm_sukhwinder_04',
    user_id: 'user_farmer_sukhwinder',
    email: 'sukhwinder.kaur@kisan.in',
    name: 'Sukhwinder Kaur',
    location: {
      latitude: 30.8165,
      longitude: 75.1716,
      address: 'Moga Rural Bypass, Punjab'
    },
    soil_type: 'Clay',
    total_acreage: 28,
    past_yield_history: [
      { crop: 'Rice', tons: 50, year: 2024, grade: 'Grade A' },
      { crop: 'Wheat', tons: 25, year: 2023, grade: 'Grade B' }
    ],
    phone: '+91-98555-12345'
  },
  {
    id: 'farm_harpreet_05',
    user_id: 'user_farmer_harpreet',
    email: 'harpreet.dhillon@kisan.in',
    name: 'Harpreet Dhillon',
    location: {
      latitude: 30.3782,
      longitude: 76.7767,
      address: 'Grand Trunk Agro Corridor, Ambala'
    },
    soil_type: 'Loamy',
    total_acreage: 80,
    past_yield_history: [
      { crop: 'Wheat', tons: 75, year: 2024, grade: 'Grade A' },
      { crop: 'Corn', tons: 50, year: 2023, grade: 'Grade A' },
      { crop: 'Soybean', tons: 42, year: 2022, grade: 'Grade A' }
    ],
    phone: '+91-99887-76655'
  },
  {
    id: 'farm_vikram_06',
    user_id: 'user_farmer_vikram',
    email: 'vikram.sharma@kisan.in',
    name: 'Vikramaditya Sharma',
    location: {
      latitude: 30.211,
      longitude: 74.9455,
      address: 'Bathinda Arid Basin, Punjab'
    },
    soil_type: 'Sandy',
    total_acreage: 22,
    past_yield_history: [
      { crop: 'Mustard', tons: 18, year: 2024, grade: 'Grade B' },
      { crop: 'Barley', tons: 22, year: 2023, grade: 'Grade B' }
    ],
    phone: '+91-94111-22334'
  },
  {
    id: 'farm_dharmendra_07',
    user_id: 'user_farmer_dharmendra',
    email: 'dharmendra.yadav@kisan.in',
    name: 'Dharmendra Yadav',
    location: {
      latitude: 26.9124,
      longitude: 75.7873,
      address: 'Jaipur Rural Sector, Rajasthan' // ~440 km away (out of radius)
    },
    soil_type: 'Black',
    total_acreage: 95,
    past_yield_history: [
      { crop: 'Cotton', tons: 85, year: 2024, grade: 'Grade A' },
      { crop: 'Wheat', tons: 40, year: 2023, grade: 'Grade A' }
    ],
    phone: '+91-91234-56780'
  }
];

export const mockContracts = [
  {
    id: 'cont_seed_wheat_01',
    processor_id: 'proc_duwarka',
    farmer_id: 'farm_kartikey',
    crop: 'Wheat',
    quantity: 50,
    agreed_price: 1275000,
    status: 'Signed',
    contract_text: `================================================================================
AGRICULTURAL FORWARD PROCUREMENT & CONTRACT FARMING AGREEMENT
Regulated under State Agricultural Produce Markets & Contract Farming Framework
Reference No: AGRI-CTR-PB-2026-DWK-001
Date of Execution: 2026-09-18
================================================================================

THIS AGREEMENT is entered into on 2026-09-18 by and between:

1. BUYER / BULK CONSUMER:
   Consumer / Enterprise Entity: Duwarka Agro Mills & Food Processing Pvt Ltd
   Registration ID: proc_duwarka | CIN: U15100PB2020PTC051288
   GSTIN: 03AABCD1234F1Z5 | FSSAI License: 10019011000999
   Registered Processing Hub: Agro Industrial Complex, Phase-2, Ludhiana, Punjab (Pin: 141010)
   Coordinates: [30.9010, 75.8573]
   Authorized Signatory: Procurement Directorate (Duwarka Agro Mills)
   (hereinafter referred to as the "Buyer / Consumer")

AND

2. FARMER / CULTIVATOR:
   Farmer / Producer: Kartikey
   Farmer ID: farm_kartikey | Aadhaar Linked Mandi ID: PB-LDH-2024-KART
   Operational Farm Land: Kisan Bio Agri Farm, Khanna Tehsil, Ludhiana District, Punjab
   Coordinates: [30.7046, 76.2215]
   Registered Landholding: 45 Acres | Soil Profile: Alluvial Clay Loam
   Direct Bank Transfer (DBT) Account: Punjab National Bank, Khanna Main Branch
   (hereinafter referred to as the "Farmer / Seller")

RECITALS / PREAMBLE:
WHEREAS the Buyer operates commercial high-grade milling and food processing facilities requiring a certified supply of premium food-grade wheat conforming to FSSAI standards;
AND WHEREAS the Farmer cultivates verified agricultural acreage with tested loamy soil conditions in Khanna agro-corridor, capable of yielding premium Sharbati wheat;
NOW, THEREFORE, the Parties mutually agree to the following legally binding covenants:

ARTICLE 1: PRODUCE SPECIFICATIONS & QUALITY ASSURANCE
1.1 Contracted Produce: Grade A Sharbati Wheat (Triticum aestivum).
1.2 Quality Grade Standard: Premium Milling Grade A. Produce shall be clean, sound, mature, uniform in amber luster, and free from live weevils, ergot, karnal bunt, dirt, and stones.
1.3 Moisture Threshold: Maximum moisture content shall not exceed 11.5% w/w upon intake weighbridge inspection.
1.4 Purity Standard: Minimum physical purity shall be 99.0% with foreign matter strictly below 0.75%.

ARTICLE 2: COMMITTED VOLUME & LOGISTICS SCHEDULE
2.1 Total Contracted Volume: 500 Quintals (Qtl) [Equivalent to 50 Metric Tons / 50,000 kg].
    *Note: 1 Quintal = 100 kg | 10 Quintals = 1 Metric Ton (1,000 kg).
2.2 Delivery Target Window: 2026-10-15 to 2026-10-25.
2.3 Delivery Intake Point: Duwarka Agro Mills Receiving Gate & Silo Bay, Phase-2, Ludhiana.
2.4 Transit Route: Farm Gate (Khanna) -> GT Road (NH-44) -> Sahnewal Bypass -> Ludhiana Industrial Silo (approx. 38.4 km).

ARTICLE 3: PRICE CONSIDERATION & ESCROW SETTLEMENT SCHEDULE
3.1 Agreed Unit Rate: ₹2,550 per Quintal (Qtl) [Equivalent to ₹25,500 per Metric Ton].
3.2 Total Consideration: ₹12,75,000 INR (Twelve Lakh Seventy-Five Thousand Indian Rupees).
3.3 Escrow Payment Milestones:
    a) Input & Mobilization Advance (20% Escrow): ₹2,55,000 INR disbursed via DBT upon bilateral signing.
    b) Final Settlement Balance (80% Escrow): ₹10,20,000 INR released immediately upon electronic weighbridge slip confirmation and mandatory lab moisture/purity pass.

ARTICLE 4: WEIGHBRIDGE CERTIFICATION & DISPUTE RESOLUTION
4.1 Net weight verified on certified electronic weighbridge (Dharam Kanta) at buyer mill premises.
4.2 Composite sample retained under joint seal for 30 days.
4.3 Governing Law: Sub-Divisional Magistrate (SDM) / APMC Market Committee Ludhiana, State of Punjab.

================================================================================
IN WITNESS WHEREOF, the Buyer and Seller digitally attest and execute this Agreement.
Buyer: Duwarka Agro Mills & Food Processing Pvt Ltd    | Seller: Kartikey
Digital Attestation Status: Verified Bilateral Contract
================================================================================`
  }
];

export const mockDeliveries = [
  {
    id: 'del_seed_01',
    contract_id: 'cont_seed_wheat_01',
    status: 'In Transit',
    delivery_date: '2026-10-15',
    tracking_notes: [
      {
        timestamp: '2026-09-18T09:00:00.000Z',
        status: 'Scheduled',
        checkpoint: 'Farm Gate Dispatch QA & Mandi Weighment Slip Generated',
        notes: 'Khanna APMC Mandi sample tested: Grade A Sharbati Wheat, moisture 10.8%, purity 99.1%. 20% advance DBT payment of ₹2,55,000 released to Kartikey.'
      },
      {
        timestamp: '2026-09-19T11:30:00.000Z',
        status: 'In Transit',
        checkpoint: 'Highway Freight Transit: Tata LPT 2818 Truck #PB-10-CZ-4421',
        notes: 'Dispatched via GT Road NH-44 Khanna -> Sahnewal -> Ludhiana Silo. Driver: Gurmeet Singh (+91-98765-88990). Telemetry GPS link active.'
      }
    ]
  }
];
