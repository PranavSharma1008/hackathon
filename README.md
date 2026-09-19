# 🌾 Contract Farming Matchmaker - Full-Stack AI Agritech Platform

An intelligent agritech platform and AI matchmaking engine connecting agricultural crop processors/buyers with qualified nearby farmers through agronomic compatibility scoring, automated legally binding forward contracts, and supply chain delivery tracking.

Built for hackathons with:
- **Frontend**: React 19 + Tailwind CSS + Lucide Icons + Vite
- **Backend**: Node.js 24 (ESM) + Express + Native SQLite (`node:sqlite`)
- **Zero external DB servers needed**: Runs out of the box!

---

## 🌟 Key Capabilities

1. **Ag-Tech Green & White Role Portal (`/`)**:
   - Role selector toggle ("I am a Food Processor" vs "I am a Farmer").
   - 2-minute pitch shortcut toolbar to jump straight to core demos.

2. **Processor Dashboard & AI Matchmaker (`/processor`)**:
   - Form to post crop demands with **⚡ Quick Demo Fill buttons** (Wheat, Potato, Soy).
   - Match Results section showing recommended farms with **compatibility score percentage badges** (0–100%).
   - Multi-factor breakdown: Soil Agronomy (25%), Distance (25%), Past Yield (30%), Capacity & Season (20%).
   - Natural language AI Recommendation quote box explaining agronomic match rationale.
   - **"Generate Smart Contract" action button** next to each match.

3. **Farmer Dashboard & Harvest Records (`/farmer`)**:
   - Farm profile form for soil type, acreage, coordinates, and past yield history with **⚡ Quick Demo Fill buttons**.
   - View incoming corporate contract requests with status badges (`Pending`, `Signed`, `Fulfilled`).
   - Real-time active delivery tracker.

4. **Contract & Visual Milestone Tracker (`/contract/:id`)**:
   - Full preview box displaying the formal AI-generated legal agreement text with a **"Sign Contract"** button.
   - **Visual step-by-step progress tracker**:
     `Contract Signed` ➔ `Harvest & QA Prep` ➔ `In Transit` ➔ `Delivered & Verified`
   - One-click pitch advancement buttons to advance milestones and watch the contract auto-fulfill in real time!

---

## 🚀 Quickstart

### 1. Installation
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Seed Mock Data
```bash
npm run seed
```

### 3. Run the App

#### Option A: Unified Full-Stack Mode (Single Port 5001)
```bash
npm run build:client
npm start
```
Open 👉 **`http://localhost:5001/`** in your browser. Both the React SPA and the API are served on port 5001!

#### Option B: Dual Development Mode (with Instant Vite HMR)
In Terminal 1 (Backend API on port 5001):
```bash
npm run dev
```

In Terminal 2 (React Vite Frontend on port 3002):
```bash
npm run dev:client
```
Open 👉 **`http://localhost:3002/`** for instant Hot Module Replacement during development.

### 4. Run Automated Backend Tests
```bash
npm test
```
*Executes all 12 end-to-end API test suites in under 1 second.*

---

## 📡 API Reference

### 1. Register a Farm
**`POST /api/farmers`**

```bash
curl -X POST http://localhost:5001/api/farmers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Balwinder Sandhu",
    "location": {
      "latitude": 30.8500,
      "longitude": 75.8200,
      "address": "Gill Road Farm, Ludhiana, Punjab"
    },
    "soil_type": "Loamy",
    "total_acreage": 40,
    "past_yield_history": [
      { "crop": "Wheat", "tons": 50, "year": 2024, "grade": "Grade A" }
    ],
    "phone": "+91-98765-00000"
  }'
```

---

### 2. Post Processor Crop Demand
**`POST /api/processors`**

```bash
curl -X POST http://localhost:5001/api/processors \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "AgroPure Flour Mills & Foods Ltd",
    "location": {
      "latitude": 30.9010,
      "longitude": 75.8573,
      "address": "Industrial Focal Point, Ludhiana, Punjab"
    },
    "required_crop": "Wheat",
    "required_grade": "Grade A",
    "quantity_needed_tons": 50,
    "max_distance_km": 100,
    "deadline": "2026-11-30",
    "target_price_per_ton": 340
  }'
```

---

### 3. AI Matching Engine
**`GET /api/match/:processor_id`**

Calculates compatibility scores across all registered farms, returning a ranked list with score breakdowns and natural language AI explanations.

```bash
curl http://localhost:5001/api/match/proc_wheat_01
```

#### Sample Response:
```json
{
  "success": true,
  "processor_demand": {
    "id": "proc_wheat_01",
    "company_name": "AgroPure Flour Mills & Foods Ltd",
    "required_crop": "Wheat",
    "required_grade": "Grade A",
    "quantity_needed_tons": 50,
    "max_distance_km": 100,
    "deadline": "2026-11-30"
  },
  "engine_metadata": {
    "algorithm": "Multi-Factor Agronomic AI Matchmaker v1.0",
    "evaluation_criteria": [
      "Geographic Haversine Distance (25%)",
      "Soil Agronomic Compatibility (25%)",
      "Historical Yield & Quality Grade Track Record (30%)",
      "Acreage Capacity & Seasonal Window (20%)"
    ],
    "total_candidates_evaluated": 8,
    "matched_count": 8
  },
  "matches": [
    {
      "rank": 1,
      "farmer_id": "farm_rajesh_01",
      "farmer_name": "Rajesh Patel",
      "distance_km": 40.57,
      "is_within_radius": true,
      "compatibility_score": 92.6,
      "match_tier": "Optimal Match",
      "score_breakdown": {
        "distance_score": 68,
        "soil_compatibility_score": 100,
        "past_yield_score": 100,
        "seasonal_score": 95,
        "capacity_score": 100
      },
      "ai_recommendation": "Rajesh Patel is classified as an Optimal Match (92.6% score) for AgroPure Flour Mills & Foods Ltd's order of 50 tons of Wheat (Grade A). Conveniently situated 40.57 km away (comfortably within the 100 km radius), minimizing transit degradation and freight overhead. The farm's Loamy soil exhibits peak agronomic suitability for Wheat cultivation. Historical performance validates proven capability: Verified history of 123 tons Wheat matching Grade A. With 65 total acres, the grower has 2.86x the estimated land required (22.7 acres) to guarantee target volumes.",
      "risk_factors": []
    }
  ]
}
```

---

### 4. AI Contract Generator
**`POST /api/contracts/generate`**

Generates a formal legal contract between the processor and selected farmer.

```bash
curl -X POST http://localhost:5001/api/contracts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "processor_id": "proc_wheat_01",
    "farmer_id": "farm_rajesh_01",
    "agreed_price": 17000,
    "quantity": 50,
    "crop": "Wheat"
  }'
```

#### Key Generated Clauses:
- Quality specifications: Moisture $\le 12\%$, purity $\ge 98.5\%$.
- Payment schedule: 20% advance mobilization tranche, 80% final settlement upon lab certification.
- Force majeure & mandatory crop insurance clauses.
- Independent third-party sampling and arbitration protocols.

---

### 5. Delivery Milestone Tracking
**`PUT /api/deliveries/track`**

Update milestone progress against a contract or delivery ID. When marked `Delivered`, the contract is automatically transitioned to `Fulfilled`.

```bash
curl -X PUT http://localhost:5001/api/deliveries/track \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "cont_seed_wheat_01",
    "status": "In Transit",
    "checkpoint": "Dispatched from farm gate via Logistics Truck #PB-10-AZ-9988",
    "notes": "Produce inspected; temperature and moisture within limits"
  }'
```

To complete final delivery:
```bash
curl -X PUT http://localhost:5001/api/deliveries/track \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "cont_seed_wheat_01",
    "status": "Delivered",
    "checkpoint": "Weighbridge & Silo Discharge",
    "notes": "Lab quality verified Grade A. Final 80% tranche released."
  }'
```

---

### Additional Helpful Endpoints
- `GET /api/farmers` - List all registered farms
- `GET /api/farmers/:id` - View single farm profile
- `GET /api/processors` - List all processor demand postings
- `GET /api/contracts` - List all contracts
- `GET /api/contracts/:id` - View single contract & legal text
- `PATCH /api/contracts/:id/sign` - Sign a pending contract
- `GET /api/deliveries` - List all deliveries
- `POST /api/seed?force=true` - Re-seed mock data on demand
- `GET /api/health` - Check API and DB status
# hackathon
# hackathon
