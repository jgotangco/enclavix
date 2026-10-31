-- =============================================================================
-- Grand Enclave Residences - Initial Database Migration
-- Target: Supabase PostgreSQL
-- Version: 2.0.0
-- =============================================================================

-- Enable UUID extension if available
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- 1. Custom Enum Types
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'TREASURER', 'GUARD', 'RESIDENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE occupancy_status AS ENUM ('OWNER_OCCUPIED', 'TENANTED', 'VACANT_LOT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_category AS ENUM (
        'MAINTENANCE', 
        'SECURITY', 
        'BILLING', 
        'PARKING_VIOLATION', 
        'PET_VIOLATION', 
        'COMPLAINT', 
        'GENERAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE amenity_type AS ENUM ('MULTIFUNCTION_HALL', 'SWIMMING_POOL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE parking_slot_type AS ENUM ('IN_GARAGE', 'CARPORT_CURB_PARALLEL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pet_species AS ENUM ('DOG', 'CAT', 'OTHER_DOMESTICATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE violation_type AS ENUM (
        'EXCEEDED_CURB_PARKING', 
        'NOT_ABOVE_CURB_PARALLEL', 
        'ROAD_OBSTRUCTION',
        'UNCOLLECTED_PET_WASTE',
        'OFF_LEASH_PET',
        'EXOTIC_OR_NON_DOMESTIC_ANIMAL',
        'PET_NOISE_DISTURBANCE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE violation_status AS ENUM ('WARNING_ISSUED', 'FINE_ASSESSED', 'RESOLVED', 'DISPUTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. Core Tables
-- =============================================================================

-- 1. Properties Master Table (150 Lots in Grand Enclave Residences)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_number VARCHAR(10) NOT NULL,
    lot_number VARCHAR(10) NOT NULL,
    unit_address VARCHAR(100) NOT NULL,
    lot_area_sqm NUMERIC(8, 2) NOT NULL,
    floor_area_sqm NUMERIC(8, 2),
    carport_capacity INT NOT NULL DEFAULT 2,
    curb_parallel_allowance INT NOT NULL DEFAULT 1,
    occupancy occupancy_status DEFAULT 'OWNER_OCCUPIED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(block_number, lot_number)
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    role user_role DEFAULT 'RESIDENT' NOT NULL,
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vehicles & Designated Parking Slots
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL,
    rfid_tag_no VARCHAR(100) UNIQUE,
    make_model VARCHAR(100),
    color VARCHAR(50),
    designated_parking parking_slot_type NOT NULL DEFAULT 'IN_GARAGE',
    sticker_valid_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, plate_number)
);

-- 4. Domesticated Pets Registry
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species pet_species NOT NULL DEFAULT 'DOG',
    breed VARCHAR(100),
    color_markings VARCHAR(150),
    is_vaccinated BOOLEAN DEFAULT FALSE,
    vaccination_expiry_date DATE,
    vaccine_card_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Violations & Security Compliance Logs (Parking & Pet Waste)
CREATE TABLE IF NOT EXISTS community_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    violation_category violation_type NOT NULL,
    plate_number VARCHAR(20),
    pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
    photo_evidence_url TEXT,
    incident_location VARCHAR(150),
    notes TEXT,
    fine_amount NUMERIC(8, 2) DEFAULT 0.00,
    status violation_status DEFAULT 'WARNING_ISSUED',
    reported_by_guard_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Billing Rates & Settings (Single Row Configuration)
CREATE TABLE IF NOT EXISTS billing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_per_sqm NUMERIC(8, 2) NOT NULL DEFAULT 25.00,
    base_fixed_fee NUMERIC(8, 2) NOT NULL DEFAULT 500.00,
    mother_village_fee NUMERIC(8, 2) NOT NULL DEFAULT 300.00,
    late_penalty_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    standard_fine_amount NUMERIC(8, 2) NOT NULL DEFAULT 500.00,
    due_day_of_month INT NOT NULL DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Invoices & Billing Records
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    billing_period VARCHAR(7) NOT NULL,
    lot_area_snapshot NUMERIC(8, 2) NOT NULL,
    rate_per_sqm_snapshot NUMERIC(8, 2) NOT NULL,
    sqm_amount NUMERIC(10, 2) NOT NULL,
    base_fixed_amount NUMERIC(10, 2) NOT NULL,
    mother_village_amount NUMERIC(10, 2) NOT NULL,
    special_assessments NUMERIC(10, 2) DEFAULT 0.00,
    penalty_amount NUMERIC(10, 2) DEFAULT 0.00,
    violation_fines_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_due NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'UNPAID',
    payment_method VARCHAR(50),
    payment_reference_no VARCHAR(100),
    proof_of_payment_url TEXT,
    paid_amount NUMERIC(10, 2),
    paid_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, billing_period)
);

-- 8. Amenity Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amenity amenity_type NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    guest_count INT NOT NULL,
    purpose TEXT,
    rental_fee NUMERIC(8, 2) DEFAULT 0.00,
    deposit_amount NUMERIC(8, 2) DEFAULT 0.00,
    status reservation_status DEFAULT 'PENDING',
    admin_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_reservation_time_range CHECK (end_time > start_time)
);

-- 9. Gate Access & Visitor Passes
CREATE TABLE IF NOT EXISTS visitor_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    visitor_name VARCHAR(150) NOT NULL,
    plate_number VARCHAR(20),
    expected_arrival TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    pass_code VARCHAR(10) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    checked_by_guard_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_pass_time_range CHECK (valid_until > expected_arrival)
);

-- 10. Service Tickets & Inquiries
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category ticket_category NOT NULL DEFAULT 'GENERAL',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'OPEN',
    admin_response TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Announcements & Bulletins
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    published_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_properties_block_lot ON properties(block_number, lot_number);
CREATE INDEX IF NOT EXISTS idx_profiles_property_id ON profiles(property_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_vehicles_property ON vehicles(property_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_rfid ON vehicles(rfid_tag_no);
CREATE INDEX IF NOT EXISTS idx_pets_property ON pets(property_id);
CREATE INDEX IF NOT EXISTS idx_pets_vaccine_expiry ON pets(vaccination_expiry_date);
CREATE INDEX IF NOT EXISTS idx_violations_property ON community_violations(property_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON community_violations(status);
CREATE INDEX IF NOT EXISTS idx_invoices_property_period ON invoices(property_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_reservations_amenity_time ON reservations(amenity, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_code ON visitor_passes(pass_code);
CREATE INDEX IF NOT EXISTS idx_tickets_property ON tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- 4. Triggers & RLS
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_pets_updated_at ON pets;
CREATE TRIGGER trg_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_billing_settings_updated_at ON billing_settings;
CREATE TRIGGER trg_billing_settings_updated_at BEFORE UPDATE ON billing_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Enable Row-Level Security on all tables (Fail-closed: no permissive policies until S02)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
