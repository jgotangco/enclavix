-- =============================================================================
-- Grand Enclave Residences - Initial Database Migration
-- Target: Supabase PostgreSQL
-- Version: 2.0.0
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE TABLE IF NOT EXISTS properties (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    block_number VARCHAR(10) NOT NULL,\n    lot_number VARCHAR(10) NOT NULL,\n    unit_address VARCHAR(100) NOT NULL,\n    lot_area_sqm NUMERIC(8, 2) NOT NULL,\n    floor_area_sqm NUMERIC(8, 2),\n    carport_capacity INT NOT NULL DEFAULT 2,\n    curb_parallel_allowance INT NOT NULL DEFAULT 1,\n    occupancy occupancy_status DEFAULT 'OWNER_OCCUPIED',\n    notes TEXT,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW(),\n    UNIQUE(block_number, lot_number)\n);\n\n-- 2. User Profiles\nCREATE TABLE IF NOT EXISTS profiles (\n    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,\n    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,\n    first_name VARCHAR(100) NOT NULL,\n    last_name VARCHAR(100) NOT NULL,\n    email VARCHAR(255) UNIQUE NOT NULL,\n    phone_number VARCHAR(50),\n    role user_role DEFAULT 'RESIDENT' NOT NULL,\n    is_primary_contact BOOLEAN DEFAULT FALSE,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 3. Vehicles & Designated Parking Slots\nCREATE TABLE IF NOT EXISTS vehicles (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,\n    plate_number VARCHAR(20) NOT NULL,\n    rfid_tag_no VARCHAR(100) UNIQUE,\n    make_model VARCHAR(100),\n    color VARCHAR(50),\n    designated_parking parking_slot_type NOT NULL DEFAULT 'IN_GARAGE',\n    sticker_valid_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),\n    is_active BOOLEAN DEFAULT TRUE,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    UNIQUE(property_id, plate_number)\n);\n\n-- 4. Domesticated Pets Registry\nCREATE TABLE IF NOT EXISTS pets (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,\n    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,\n    name VARCHAR(100) NOT NULL,\n    species pet_species NOT NULL DEFAULT 'DOG',\n    breed VARCHAR(100),\n    color_markings VARCHAR(150),\n    is_vaccinated BOOLEAN DEFAULT FALSE,\n    vaccination_expiry_date DATE,\n    vaccine_card_url TEXT,\n    is_active BOOLEAN DEFAULT TRUE,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 5. Violations & Security Compliance Logs (Parking & Pet Waste)\nCREATE TABLE IF NOT EXISTS community_violations (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,\n    violation_category violation_type NOT NULL,\n    plate_number VARCHAR(20),\n    pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,\n    photo_evidence_url TEXT,\n    incident_location VARCHAR(150),\n    notes TEXT,\n    fine_amount NUMERIC(8, 2) DEFAULT 0.00,\n    status violation_status DEFAULT 'WARNING_ISSUED',\n    reported_by_guard_id UUID REFERENCES profiles(id),\n    created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 6. Billing Rates & Settings (Single Row Configuration)\nCREATE TABLE IF NOT EXISTS billing_settings (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    rate_per_sqm NUMERIC(8, 2) NOT NULL DEFAULT 25.00,\n    base_fixed_fee NUMERIC(8, 2) NOT NULL DEFAULT 500.00,\n    mother_village_fee NUMERIC(8, 2) NOT NULL DEFAULT 300.00,\n    late_penalty_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,\n    standard_fine_amount NUMERIC(8, 2) NOT NULL DEFAULT 500.00,\n    due_day_of_month INT NOT NULL DEFAULT 15,\n    is_active BOOLEAN DEFAULT TRUE,\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 7. Invoices & Billing Records\nCREATE TABLE IF NOT EXISTS invoices (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,\n    billing_period VARCHAR(7) NOT NULL,\n    lot_area_snapshot NUMERIC(8, 2) NOT NULL,\n    rate_per_sqm_snapshot NUMERIC(8, 2) NOT NULL,\n    sqm_amount NUMERIC(10, 2) NOT NULL,\n    base_fixed_amount NUMERIC(10, 2) NOT NULL,\n    mother_village_amount NUMERIC(10, 2) NOT NULL,\n    special_assessments NUMERIC(10, 2) DEFAULT 0.00,\n    penalty_amount NUMERIC(10, 2) DEFAULT 0.00,\n    violation_fines_amount NUMERIC(10, 2) DEFAULT 0.00,\n    total_due NUMERIC(10, 2) NOT NULL,\n    due_date DATE NOT NULL,\n    status invoice_status DEFAULT 'UNPAID',\n    payment_method VARCHAR(50),\n    payment_reference_no VARCHAR(100),\n    proof_of_payment_url TEXT,\n    paid_amount NUMERIC(10, 2),\n    paid_at TIMESTAMPTZ,\n    verified_by UUID REFERENCES profiles(id),\n    notes TEXT,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    UNIQUE(property_id, billing_period)\n);\n\n-- 8. Amenity Reservations\nCREATE TABLE IF NOT EXISTS reservations (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,\n    resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,\n    amenity amenity_type NOT NULL,\n    start_time TIMESTAMPTZ NOT NULL,\n    end_time TIMESTAMPTZ NOT NULL,\n    guest_count INT NOT NULL,\n    purpose TEXT,\n    rental_fee NUMERIC(8, 2) DEFAULT 0.00,\n    deposit_amount NUMERIC(8, 2) DEFAULT 0.00,\n    status reservation_status DEFAULT 'PENDING',\n    admin_remarks TEXT,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    CONSTRAINT valid_reservation_time_range CHECK (end_time > start_time)\n);\n\n-- 9. Gate Access & Visitor Passes\nCREATE TABLE IF NOT EXISTS visitor_passes (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,\n    visitor_name VARCHAR(150) NOT NULL,\n    plate_number VARCHAR(20),\n    expected_arrival TIMESTAMPTZ NOT NULL,\n    valid_until TIMESTAMPTZ NOT NULL,\n    pass_code VARCHAR(10) UNIQUE NOT NULL,\n    status VARCHAR(20) DEFAULT 'ACTIVE',\n    checked_in_at TIMESTAMPTZ,\n    checked_out_at TIMESTAMPTZ,\n    checked_by_guard_id UUID REFERENCES profiles(id),\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    CONSTRAINT valid_pass_time_range CHECK (valid_until > expected_arrival)\n);\n\n-- 10. Service Tickets & Inquiries\nCREATE TABLE IF NOT EXISTS tickets (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,\n    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,\n    category ticket_category NOT NULL DEFAULT 'GENERAL',\n    subject VARCHAR(255) NOT NULL,\n    description TEXT NOT NULL,\n    status ticket_status DEFAULT 'OPEN',\n    admin_response TEXT,\n    resolved_at TIMESTAMPTZ,\n    created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 11. Announcements & Bulletins\nCREATE TABLE IF NOT EXISTS announcements (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n    title VARCHAR(255) NOT NULL,\n    content TEXT NOT NULL,\n    is_urgent BOOLEAN DEFAULT FALSE,\n    published_by UUID NOT NULL REFERENCES profiles(id),\n    created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 3. Indexes\nCREATE INDEX IF NOT EXISTS idx_properties_block_lot ON properties(block_number, lot_number);\nCREATE INDEX IF NOT EXISTS idx_profiles_property_id ON profiles(property_id);\nCREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);\nCREATE INDEX IF NOT EXISTS idx_vehicles_property ON vehicles(property_id);\nCREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);\nCREATE INDEX IF NOT EXISTS idx_vehicles_rfid ON vehicles(rfid_tag_no);\nCREATE INDEX IF NOT EXISTS idx_pets_property ON pets(property_id);\nCREATE INDEX IF NOT EXISTS idx_pets_vaccine_expiry ON pets(vaccination_expiry_date);\nCREATE INDEX IF NOT EXISTS idx_violations_property ON community_violations(property_id);\nCREATE INDEX IF NOT EXISTS idx_violations_status ON community_violations(status);\nCREATE INDEX IF NOT EXISTS idx_invoices_property_period ON invoices(property_id, billing_period);\nCREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);\nCREATE INDEX IF NOT EXISTS idx_reservations_amenity_time ON reservations(amenity, start_time, end_time);\nCREATE INDEX IF NOT EXISTS idx_visitor_passes_code ON visitor_passes(pass_code);\nCREATE INDEX IF NOT EXISTS idx_tickets_property ON tickets(property_id);\nCREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);\n\n-- 4. Triggers & RLS\nCREATE OR REPLACE FUNCTION update_timestamp()\nRETURNS TRIGGER AS $$\nBEGIN\n    NEW.updated_at = NOW();\n    RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n\nDROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;\nCREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_timestamp();\n\nDROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;\nCREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();\n\nDROP TRIGGER IF EXISTS trg_pets_updated_at ON pets;\nCREATE TRIGGER trg_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_timestamp();\n\nDROP TRIGGER IF EXISTS trg_billing_settings_updated_at ON billing_settings;\nCREATE TRIGGER trg_billing_settings_updated_at BEFORE UPDATE ON billing_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();\n