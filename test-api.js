process.env.NODE_ENV = 'test';

import http from 'node:http';
import app from './src/server.js';
import { seedDatabase } from './src/seed.js';

let server;
const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Automated Contract Farming Matchmaker Tests');
  console.log('======================================================\n');

  // Start test server
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Listening on port ${TEST_PORT}\n`);
      resolve();
    });
  });

  try {
    // Reset seed data
    seedDatabase({ force: true });

    // 1. Test Health Check
    console.log('Test 1: GET /api/health');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'Health check returns 200 OK');
    assert(healthRes.body.status === 'healthy', 'Health status is healthy');
    assert(healthRes.body.database.farmers_count >= 7, 'Database contains seeded farmers');

    // 2. Test POST /api/farmers (Register a farm)
    console.log('\nTest 2: POST /api/farmers (Register a farm)');
    const newFarmer = {
      name: 'Balwinder Sandhu',
      location: {
        latitude: 30.8500,
        longitude: 75.8200,
        address: 'Gill Road Farm, Ludhiana, Punjab'
      },
      soil_type: 'Loamy',
      total_acreage: 40,
      past_yield_history: [
        { crop: 'Wheat', tons: 50, year: 2024, grade: 'Grade A' },
        { crop: 'Potato', tons: 45, year: 2023, grade: 'Grade A' }
      ],
      phone: '+91-98765-00000'
    };
    const createFarmerRes = await request('POST', '/api/farmers', newFarmer);
    assert(createFarmerRes.status === 201, 'Farmer registered with 201 Created');
    assert(createFarmerRes.body.success === true, 'Response success is true');
    assert(createFarmerRes.body.data.id.startsWith('farm_'), 'Farmer ID generated correctly');
    assert(createFarmerRes.body.data.soil_type === 'Loamy', 'Soil type stored as Loamy');
    const registeredFarmerId = createFarmerRes.body.data.id;

    // 3. Test Validation on POST /api/farmers
    console.log('\nTest 3: POST /api/farmers validation (Missing coordinates)');
    const invalidFarmerRes = await request('POST', '/api/farmers', { name: 'Incomplete Farm' });
    assert(invalidFarmerRes.status === 400, 'Rejects missing coordinates with 400 Bad Request');

    // 4. Test GET /api/farmers
    console.log('\nTest 4: GET /api/farmers (List all farms)');
    const farmersListRes = await request('GET', '/api/farmers');
    assert(farmersListRes.status === 200, 'Returns 200 OK');
    assert(farmersListRes.body.count >= 8, 'List contains 8+ farms');

    // 5. Test POST /api/processors (Post processor crop demand)
    console.log('\nTest 5: POST /api/processors (Post crop demand)');
    const newProcessor = {
      company_name: 'FreshHarvest Organics Ltd',
      location: {
        latitude: 30.9100,
        longitude: 75.8600,
        address: 'Agro Industrial Complex, Ludhiana'
      },
      required_crop: 'Wheat',
      required_grade: 'Grade A',
      quantity_needed_tons: 60,
      max_distance_km: 100,
      deadline: '2026-11-20',
      target_price_per_ton: 350
    };
    const createProcRes = await request('POST', '/api/processors', newProcessor);
    assert(createProcRes.status === 201, 'Processor demand registered with 201 Created');
    assert(createProcRes.body.data.id.startsWith('proc_'), 'Processor ID generated');
    const testProcId = createProcRes.body.data.id;

    // 6. Test GET /api/match/:processor_id (AI Matching Engine)
    console.log('\nTest 6: GET /api/match/:processor_id (AI Matching Engine)');
    const matchRes = await request('GET', `/api/match/${testProcId}`);
    assert(matchRes.status === 200, 'Match returns 200 OK');
    assert(matchRes.body.matches.length > 0, 'Returns matched candidate farms');
    assert(matchRes.body.matches[0].rank === 1, 'Top candidate ranked #1');
    assert(matchRes.body.matches[0].compatibility_score >= matchRes.body.matches[1].compatibility_score, 'Matches sorted by compatibility score descending');
    assert(typeof matchRes.body.matches[0].ai_recommendation === 'string', 'Contains AI recommendation narrative');
    assert(typeof matchRes.body.matches[0].score_breakdown.soil_compatibility_score === 'number', 'Includes soil score');
    assert(typeof matchRes.body.matches[0].score_breakdown.distance_score === 'number', 'Includes distance score');
    assert(typeof matchRes.body.matches[0].score_breakdown.past_yield_score === 'number', 'Includes past yield score');

    console.log(`    -> Top Match: ${matchRes.body.matches[0].farmer_name} | Score: ${matchRes.body.matches[0].compatibility_score}% | Distance: ${matchRes.body.matches[0].distance_km} km`);
    console.log(`    -> AI Narrative: "${matchRes.body.matches[0].ai_recommendation.substring(0, 120)}..."`);

    // 7. Test Distance Penalization in Matching
    console.log('\nTest 7: Verify distance penalty on distant farms');
    const distantFarmerMatch = matchRes.body.matches.find((m) => m.farmer_name === 'Dharmendra Yadav');
    assert(distantFarmerMatch.is_within_radius === false, 'Distant farmer flagged as out of radius');
    assert(distantFarmerMatch.risk_factors.length > 0, 'Distant farmer has risk factor logged');

    // 8. Test POST /api/contracts/generate (AI Contract Generator)
    console.log('\nTest 8: POST /api/contracts/generate (AI Contract Generator)');
    const topFarmer = matchRes.body.matches[0];
    const contractPayload = {
      processor_id: testProcId,
      farmer_id: topFarmer.farmer_id,
      agreed_price: 21000,
      quantity: 60,
      crop: 'Wheat'
    };
    const contractRes = await request('POST', '/api/contracts/generate', contractPayload);
    assert(contractRes.status === 201, 'Contract generated with 201 Created');
    assert(contractRes.body.data.id.startsWith('cont_'), 'Contract ID generated');
    assert(contractRes.body.data.status === 'Pending', 'Contract status starts as Pending');
    assert(
      contractRes.body.data.contract_text.includes('KRISHI ANUBANDH PATRA') ||
      contractRes.body.data.contract_text.includes('CONTRACT FARMING AGREEMENT'),
      'Generates legal contract text'
    );
    assert(contractRes.body.data.contract_text.includes(newProcessor.company_name), 'Contract includes Buyer company name');
    assert(contractRes.body.data.contract_text.includes(topFarmer.farmer_name), 'Contract includes Farmer name');
    const generatedContractId = contractRes.body.data.id;

    // 9. Test PATCH /api/contracts/:id/sign (Sign contract)
    console.log('\nTest 9: PATCH /api/contracts/:id/sign');
    const signRes = await request('PATCH', `/api/contracts/${generatedContractId}/sign`);
    assert(signRes.status === 200, 'Contract signed successfully with 200 OK');
    assert(signRes.body.data.status === 'Signed', 'Contract status updated to Signed');

    // 10. Test PUT /api/deliveries/track (Updates delivery milestones against contract)
    console.log('\nTest 10: PUT /api/deliveries/track (Track milestone: In Transit)');
    const trackTransitRes = await request('PUT', '/api/deliveries/track', {
      contract_id: generatedContractId,
      status: 'In Transit',
      checkpoint: 'Loaded at farm gate, highway dispatch',
      notes: 'Truck #PB-08-TR-1234 departed farm with 60 MT Grade A Wheat'
    });
    assert(trackTransitRes.status === 200, 'Delivery tracking returns 200 OK');
    assert(trackTransitRes.body.data.status === 'In Transit', 'Delivery status is In Transit');
    assert(trackTransitRes.body.data.tracking_notes.length >= 1, 'Milestone recorded in tracking history');
    const deliveryId = trackTransitRes.body.data.id;

    // 11. Test PUT /api/deliveries/track (Milestone: Delivered & Auto-fulfill contract)
    console.log('\nTest 11: PUT /api/deliveries/track (Mark Delivered -> Auto-fulfill contract)');
    const trackDeliveredRes = await request('PUT', '/api/deliveries/track', {
      delivery_id: deliveryId,
      status: 'Delivered',
      checkpoint: 'Weighbridge & Silo Unloading Complete',
      notes: 'Lab verified Grade A purity 99.1%, moisture 11.2%. Payment release authorized.'
    });
    assert(trackDeliveredRes.status === 200, 'Delivery marked Delivered');
    assert(trackDeliveredRes.body.contract_fulfilled === true, 'Contract fulfilled flag true');
    assert(trackDeliveredRes.body.data.tracking_notes.length >= 2, 'Cumulative milestones preserved in tracking history');

    // Verify contract status is now Fulfilled in DB
    const contractCheckRes = await request('GET', `/api/contracts/${generatedContractId}`);
    assert(contractCheckRes.body.data.status === 'Fulfilled', 'Contract status automatically transitioned to Fulfilled');

    // 12. Test 404 handling
    console.log('\nTest 12: GET /api/match/:processor_id non-existent ID (404 check)');
    const notFoundRes = await request('GET', '/api/match/proc_does_not_exist');
    assert(notFoundRes.status === 404, 'Non-existent processor returns 404 Not Found');

    // 13. Test Admin Authentication (codekalesh@gmail.com / codekalesh@gmail.com)
    console.log('\nTest 13: POST /api/auth/login with Admin Credentials (codekalesh@gmail.com)');
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: 'codekalesh@gmail.com',
      password: 'codekalesh@gmail.com'
    });
    assert(adminLoginRes.status === 200, 'Admin login returns 200 OK');
    assert(adminLoginRes.body.user.role === 'admin', 'Admin user role is admin');
    assert(adminLoginRes.body.user.email === 'codekalesh@gmail.com', 'Admin email matches codekalesh@gmail.com');
    assert(adminLoginRes.body.user.is_trusted_processor === true, 'Admin has trusted status');

    // 14. Test Provider / Processor Application Submission
    console.log('\nTest 14: POST /api/providers/apply (User applies to become a trusted processor)');
    const applyRes = await request('POST', '/api/providers/apply', {
      company_name: 'Punjab Agro Milling Enterprises',
      user_email: 'applicant.miller@agro.in',
      phone: '+91-98765-99887',
      gst_number: '03AABCP9988K1Z5',
      fssai_license: '10022011000999',
      address: 'Grain Market Road, Khanna, Punjab',
      latitude: 30.7073,
      longitude: 76.2167,
      processing_capacity_tons: 650,
      target_crops: 'Wheat, Mustard'
    });
    assert(applyRes.status === 201, 'Provider application submitted with 201 Created');
    assert(applyRes.body.application.status === 'pending', 'Application status starts as pending');
    const newAppId = applyRes.body.application.id;

    // 15. Test Admin Approves Provider to Trusted Processor
    console.log('\nTest 15: POST /api/admin/applications/:id/approve (Admin grants trusted processor status)');
    const approveRes = await request('POST', `/api/admin/applications/${newAppId}/approve`, {
      admin_notes: 'Approved by admin codekalesh@gmail.com. Verified business registration and APMC mandate.'
    });
    assert(approveRes.status === 200, 'Approval returns 200 OK');
    assert(approveRes.body.application.status === 'approved', 'Application status updated to approved');
    assert(approveRes.body.processor !== null, 'Processor entity registered in system');

    // 16. Test Farmer Produce Store (Adding material with ₹/Quintal price and marketplace lookup)
    console.log('\nTest 16: Farmer Produce Store & Inventory (Add material with ₹/Quintal rate)');
    const addStoreRes = await request('POST', '/api/farmers/farm_rajesh_01/store', {
      crop_name: 'Premium Sharbati Wheat Batch #9',
      grade: 'Grade A',
      quantity_quintals: 500,
      price_per_quintal: 2500, // ₹2,500 per Quintal
      storage_type: 'Farm Silo',
      harvest_date: '2026-09-01',
      moisture_percentage: 11.0,
      soil_type: 'Alluvial',
      notes: 'Super clean harvest from organic plot.'
    });
    assert(addStoreRes.status === 201, 'Item added to farmer store with 201 Created');
    assert(addStoreRes.body.data.price_per_quintal === 2500, 'Price stored as ₹2,500/Quintal');
    assert(addStoreRes.body.data.soil_type === 'Alluvial', 'Cultivated soil type persisted in store item');
    assert(addStoreRes.body.data.total_value_inr === 1250000, 'Total value calculated (500 Qtl * ₹2,500 = ₹12,50,000)');

    // 17. Test Duplicate Email Prevention (High Security Check)
    console.log('\nTest 17: User Registration Duplicate Email Rejection (409 Conflict)');
    const dupRegRes = await request('POST', '/api/auth/register', {
      email: 'codekalesh@gmail.com', // Already registered admin email
      password: 'newpassword123',
      name: 'Imposter User',
      role: 'farmer'
    });
    assert(dupRegRes.status === 409, 'Rejects duplicate email with 409 Conflict');
    assert(dupRegRes.body.success === false, 'Duplicate response success is false');

    // 18. Test Farmer Onboarding Requirements Persistence
    console.log('\nTest 18: Farmer Registration with Soil, Acreage & Requirements Stored in DB');
    const newFarmerEmail = `kisan_${Date.now()}@punjabfarms.in`;
    const newFarmerRes = await request('POST', '/api/auth/register', {
      email: newFarmerEmail,
      password: 'securekisanpass',
      name: 'Harbhajan Singh',
      phone: '+91-98777-66554',
      role: 'farmer',
      soil_type: 'Clay Loam',
      total_acreage: 45,
      address: 'Village Raikot, Ludhiana District, Punjab',
      latitude: 30.6500,
      longitude: 75.6000,
      past_yield_history: [
        { crop: 'Wheat', tons: 55, year: 2024, grade: 'Grade A' },
        { crop: 'Basmati Rice', tons: 40, year: 2024, grade: 'Grade A' }
      ]
    });
    assert(newFarmerRes.status === 201, 'Farmer registered with 201 Created');
    assert(newFarmerRes.body.user.role === 'farmer', 'User role assigned as farmer');
    assert(newFarmerRes.body.user.farmer_profile.soil_type === 'Clay Loam', 'Soil type persisted in DB');
    assert(newFarmerRes.body.user.farmer_profile.total_acreage === 45, 'Acreage persisted in DB');

    // 19. Test Farmer Isolation: Farmer adds to their own private store
    console.log('\nTest 19: Farmer Isolation & Security Check');
    const farmerFarmId = newFarmerRes.body.user.farmer_id;
    const farmerStoreAdd = await request('POST', `/api/farmers/${farmerFarmId}/store`, {
      crop_name: 'Organic Basmati Paddy 1121',
      grade: 'Grade A',
      quantity_quintals: 300,
      price_per_quintal: 3800,
      storage_type: 'Farm Silo',
      harvest_date: '2026-09-10'
    });
    assert(farmerStoreAdd.status === 201, 'Farmer added inventory to own store');
    
    // Verify farmer own store endpoint
    const farmerStoreRes = await request('GET', `/api/farmers/${farmerFarmId}/store`);
    assert(farmerStoreRes.status === 200, 'Fetched farmer store successfully');
    assert(farmerStoreRes.body.data.length === 1, 'Farmer store strictly contains only their own item');
    // 20. Test Visitor Registration & Material Ordering Restriction (Explore Mode)
    console.log('\nTest 20: Visitor Mode & Order Restriction (403 Forbidden on Order)');
    const visitorEmail = `visitor_${Date.now()}@agriobserver.in`;
    const visitorRegRes = await request('POST', '/api/auth/register', {
      email: visitorEmail,
      password: 'visitorpassword',
      name: 'Observer Simran',
      role: 'visitor'
    });
    assert(visitorRegRes.status === 201, 'Visitor registered with 201 Created');
    assert(visitorRegRes.body.user.role === 'visitor', 'User role assigned as visitor');

    // Attempt to order material as visitor -> MUST BE REJECTED with 403 Forbidden
    const visitorOrderRes = await request('POST', '/api/store/requests', {
      store_item_id: 'item_seed_wheat_01',
      buyer_role: 'visitor',
      buyer_name: 'Observer Simran',
      buyer_email: visitorEmail,
      quantity_quintals: 50,
      offered_price_per_quintal: 2500
    });
    assert(visitorOrderRes.status === 403, 'Visitor ordering rejected with 403 Forbidden');
    assert(visitorOrderRes.body.error.includes('Visitor accounts are in Explore-Only Mode'), 'Correct read-only explanation returned');

    // 21. Test Service Status ON/OFF Toggle
    console.log('\nTest 21: Service Status Toggle (ON / OFF)');
    const toggleOffRes = await request('PUT', '/api/auth/service-toggle', {
      user_id: newFarmerRes.body.user.id,
      is_service_active: false
    });
    assert(toggleOffRes.status === 200, 'Service toggle returns 200 OK');
    assert(toggleOffRes.body.service_status === false, 'Service status toggled to OFF');

    // 22. Verify Contract Dispatch Rejection when Farmer Service is OFF
    console.log('\nTest 22: Contract Dispatch Blocked when Target Farmer Service is OFF');
    const contractBlockedRes = await request('POST', '/api/contracts/generate', {
      processor_id: testProcId,
      farmer_id: farmerFarmId,
      agreed_price: 25000,
      quantity: 20,
      crop: 'Wheat'
    });
    assert(contractBlockedRes.status === 400, 'Rejects contract dispatch with 400 Bad Request');
    assert(contractBlockedRes.body.error.includes('temporarily turned their services OFF'), 'Explains farmer service is OFF');

    // Turn farmer service back ON
    const toggleOnRes = await request('PUT', '/api/auth/service-toggle', {
      user_id: newFarmerRes.body.user.id,
      is_service_active: true
    });
    assert(toggleOnRes.body.service_status === true, 'Service toggled back to ON');

    // 23. Test Serve and Cancel Request Workflows on Contracts
    console.log('\nTest 23: Serve and Cancel Request Workflows on Contracts');
    const newContractRes = await request('POST', '/api/contracts/generate', {
      processor_id: testProcId,
      farmer_id: farmerFarmId,
      agreed_price: 25000,
      quantity: 15,
      crop: 'Wheat'
    });
    assert(newContractRes.status === 201, 'Contract generated while service ON');
    const actionContractId = newContractRes.body.data.id;

    // Test Farmer Serves / Accepts the Request
    const serveRes = await request('PATCH', `/api/contracts/${actionContractId}/serve`, {
      served_by: 'farmer'
    });
    assert(serveRes.status === 200, 'Serve request returns 200 OK');
    assert(serveRes.body.data.status === 'Accepted', 'Contract status advanced to Accepted');
    assert(serveRes.body.data.served_by === 'farmer', 'Served by farmer recorded');

    // Test Cancel Request
    const cancelRes = await request('PATCH', `/api/contracts/${actionContractId}/cancel`, {
      cancelled_by: 'processor',
      reason: 'Quality standards updated by mill'
    });
    assert(cancelRes.status === 200, 'Cancel request returns 200 OK');
    assert(cancelRes.body.data.status === 'Cancelled', 'Contract status updated to Cancelled');
    assert(cancelRes.body.data.cancel_reason === 'Quality standards updated by mill', 'Cancel reason preserved');

    // 24. Test Admin Grants Visitor Access to Become a Farmer
    console.log('\nTest 24: Admin Grants Visitor Commercial Farmer Access');
    const grantRoleRes = await request('PUT', `/api/admin/users/${visitorRegRes.body.user.id}/role`, {
      role: 'farmer'
    });
    assert(grantRoleRes.status === 200, 'Admin role update returns 200 OK');
    assert(grantRoleRes.body.user.role === 'farmer', 'User upgraded from visitor to farmer');

    console.log('\n======================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (24/24 test groups)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(0);
  }
}

runTests();
