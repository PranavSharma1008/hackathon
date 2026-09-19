-- Contract Farming Matchmaker Database Schema (SQLite)

-- 1. User Authentication & Multi-Role System
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'farmer', -- 'farmer', 'processor', 'admin', 'visitor'
    is_trusted_processor INTEGER DEFAULT 0,
    service_status INTEGER DEFAULT 1, -- 1 = Service ON, 0 = Service OFF
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    email TEXT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    soil_type TEXT NOT NULL,
    total_acreage REAL NOT NULL,
    land_parcels TEXT NOT NULL DEFAULT '[]', -- JSON string of [{id, name, soil_type, acreage, address, irrigation_type, primary_crop, notes}]
    past_yield_history TEXT NOT NULL DEFAULT '[]', -- JSON string of [{crop, tons, year, grade}]
    phone TEXT,
    is_service_active INTEGER DEFAULT 1, -- 1 = ON (accepting contracts/requests), 0 = OFF
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farmers_user ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_email ON farmers(email);
CREATE INDEX IF NOT EXISTS idx_farmers_soil ON farmers(soil_type);

-- 3. Processors Table
CREATE TABLE IF NOT EXISTS processors (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    is_trusted INTEGER DEFAULT 1,
    is_service_active INTEGER DEFAULT 1, -- 1 = ON (procurement intake active), 0 = OFF
    company_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    required_crop TEXT NOT NULL,
    required_grade TEXT NOT NULL,
    quantity_needed_tons REAL NOT NULL,
    max_distance_km REAL NOT NULL,
    deadline TEXT NOT NULL,
    target_price_per_ton REAL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_processors_crop ON processors(required_crop);

-- 4. Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    processor_id TEXT NOT NULL REFERENCES processors(id) ON DELETE CASCADE,
    farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop TEXT NOT NULL,
    quantity REAL NOT NULL,
    agreed_price REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Accepted', 'Signed', 'Fulfilled', 'Cancelled')) DEFAULT 'Pending',
    served_by TEXT, -- 'farmer' | 'processor'
    cancelled_by TEXT, -- 'farmer' | 'processor' | 'admin'
    cancel_reason TEXT,
    contract_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_farmer ON contracts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_processor ON contracts(processor_id);

-- 5. Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK(status IN ('Scheduled', 'In Transit', 'Delivered')) DEFAULT 'Scheduled',
    delivery_date TEXT NOT NULL,
    tracking_notes TEXT DEFAULT '[]', -- JSON array of milestone events
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deliveries_contract ON deliveries(contract_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- 6. Provider / Processor Verification Applications
CREATE TABLE IF NOT EXISTS processor_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    company_name TEXT NOT NULL,
    phone TEXT,
    gst_number TEXT,
    fssai_license TEXT,
    address TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    processing_capacity_tons REAL NOT NULL DEFAULT 500,
    target_crops TEXT NOT NULL DEFAULT 'Wheat, Potato, Soybean',
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TEXT NOT NULL,
    reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON processor_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON processor_applications(user_email);

-- 7. Farmer Produce Store & Inventory (Farmer adds material & sets prices in ₹/Quintal)
CREATE TABLE IF NOT EXISTS farmer_store_items (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    quantity_quintals REAL NOT NULL,
    price_per_quintal REAL NOT NULL,
    storage_type TEXT NOT NULL DEFAULT 'Farm Silo', -- 'Farm Silo', 'Cold Storage', 'Mandi Warehouse', 'On-Farm Shed'
    harvest_date TEXT,
    moisture_percentage REAL DEFAULT 11.5,
    local_names TEXT DEFAULT '',
    soil_type TEXT NOT NULL DEFAULT 'Loamy',
    status TEXT NOT NULL CHECK(status IN ('available', 'reserved', 'sold')) DEFAULT 'available',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_farmer ON farmer_store_items(farmer_id);
CREATE INDEX IF NOT EXISTS idx_store_crop ON farmer_store_items(crop_name);
CREATE INDEX IF NOT EXISTS idx_store_status ON farmer_store_items(status);

-- 8. Store Order & Trade Requests (Serve or Cancel by Farmer / Processor)
CREATE TABLE IF NOT EXISTS store_requests (
    id TEXT PRIMARY KEY,
    store_item_id TEXT NOT NULL REFERENCES farmer_store_items(id) ON DELETE CASCADE,
    farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    buyer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_role TEXT NOT NULL DEFAULT 'processor',
    crop_name TEXT NOT NULL,
    quantity_quintals REAL NOT NULL,
    offered_price_per_quintal REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Served', 'Cancelled')) DEFAULT 'Pending',
    cancel_reason TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_req_farmer ON store_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_store_req_buyer ON store_requests(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_store_req_status ON store_requests(status);
