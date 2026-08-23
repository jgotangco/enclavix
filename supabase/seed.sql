-- =============================================================================
-- Grand Enclave Residences - Seed Data (150 Lots)
-- =============================================================================

-- 1. Default Billing Settings
INSERT INTO billing_settings (id, rate_per_sqm, base_fixed_fee, mother_village_fee, late_penalty_percent, standard_fine_amount, due_day_of_month, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    25.00,
    500.00,
    300.00,
    5.00,
    500.00,
    15,
    true
)
ON CONFLICT (id) DO UPDATE SET
    rate_per_sqm = EXCLUDED.rate_per_sqm,
    base_fixed_fee = EXCLUDED.base_fixed_fee,
    mother_village_fee = EXCLUDED.mother_village_fee;

-- 2. Populate 99 Lots across Blocks 1 to 5
INSERT INTO properties (id, block_number, lot_number, unit_address, lot_area_sqm, floor_area_sqm, carport_capacity, curb_parallel_allowance, occupancy, notes)
VALUES
    -- Block 1 (Lots 1 - 20)
    ('b1000000-0000-0000-0000-000000000001', '1', '1', 'Block 1 Lot 1, Grand Enclave Residences', 240.00, 290.00, 2, 1, 'OWNER_OCCUPIED', 'Corner unit near entrance gate'),
    ('b1000000-0000-0000-0000-000000000002', '1', '2', 'Block 1 Lot 2, Grand Enclave Residences', 180.00, 220.00, 2, 1, 'OWNER_OCCUPIED', 'Standard townhouse'),
    ('b1000000-0000-0000-0000-000000000003', '1', '3', 'Block 1 Lot 3, Grand Enclave Residences', 180.00, 220.00, 2, 1, 'TENANTED', 'Tenanted by Santos family'),
    ('b1000000-0000-0000-0000-000000000004', '1', '4', 'Block 1 Lot 4, Grand Enclave Residences', 195.00, 240.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b1000000-0000-0000-0000-000000000005', '1', '5', 'Block 1 Lot 5, Grand Enclave Residences', 210.00, 255.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b1000000-0000-0000-0000-000000000006', '1', '6', 'Block 1 Lot 6, Grand Enclave Residences', 180.00, 220.00, 2, 1, 'VACANT_LOT', 'Under architectural renovation'),
    ('b1000000-0000-0000-0000-000000000007', '1', '7', 'Block 1 Lot 7, Grand Enclave Residences', 180.00, 220.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b1000000-0000-0000-0000-000000000008', '1', '8', 'Block 1 Lot 8, Grand Enclave Residences', 200.00, 245.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b1000000-0000-0000-0000-000000000009', '1', '9', 'Block 1 Lot 9, Grand Enclave Residences', 180.00, 220.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b1000000-0000-0000-0000-000000000010', '1', '10', 'Block 1 Lot 10, Grand Enclave Residences', 220.00, 270.00, 2, 1, 'OWNER_OCCUPIED', ''),
    -- Block 2 (Lots 1 - 20)
    ('b2000000-0000-0000-0000-000000000001', '2', '1', 'Block 2 Lot 1, Grand Enclave Residences', 260.00, 310.00, 2, 1, 'OWNER_OCCUPIED', 'President Residence'),
    ('b2000000-0000-0000-0000-000000000002', '2', '2', 'Block 2 Lot 2, Grand Enclave Residences', 190.00, 230.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b2000000-0000-0000-0000-000000000003', '2', '3', 'Block 2 Lot 3, Grand Enclave Residences', 190.00, 230.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b2000000-0000-0000-0000-000000000004', '2', '4', 'Block 2 Lot 4, Grand Enclave Residences', 205.00, 250.00, 2, 1, 'TENANTED', ''),
    ('b2000000-0000-0000-0000-000000000005', '2', '5', 'Block 2 Lot 5, Grand Enclave Residences', 190.00, 230.00, 2, 1, 'OWNER_OCCUPIED', ''),
    -- Block 3 (Lots 1 - 20)
    ('b3000000-0000-0000-0000-000000000001', '3', '1', 'Block 3 Lot 1, Grand Enclave Residences', 230.00, 280.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b3000000-0000-0000-0000-000000000002', '3', '2', 'Block 3 Lot 2, Grand Enclave Residences', 180.00, 220.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b3000000-0000-0000-0000-000000000003', '3', '3', 'Block 3 Lot 3, Grand Enclave Residences', 180.00, 220.00, 2, 1, 'OWNER_OCCUPIED', ''),
    -- Block 4 & 5 Sample Lots
    ('b4000000-0000-0000-0000-000000000001', '4', '1', 'Block 4 Lot 1, Grand Enclave Residences', 215.00, 260.00, 2, 1, 'OWNER_OCCUPIED', ''),
    ('b5000000-0000-0000-0000-000000000001', '5', '1', 'Block 5 Lot 1, Grand Enclave Residences', 250.00, 300.00, 2, 1, 'OWNER_OCCUPIED', '')
ON CONFLICT (block_number, lot_number) DO NOTHING;

-- Generate remaining sample lots to total 150 lots across Blocks 1 to 8
DO $$
DECLARE
    b INT;
    l INT;
    max_l INT;
    blk_str VARCHAR(10);
    lot_str VARCHAR(10);
    addr VARCHAR(100);
    lot_sz NUMERIC(8,2);
    flr_sz NUMERIC(8,2);
BEGIN
    FOR b IN 1..8 LOOP
        IF b = 8 THEN
            max_l := 10; -- Block 8 has 10 lots (Total = 7*20 + 10 = 150 lots)
        ELSE
            max_l := 20;
        END IF;

        FOR l IN 1..max_l LOOP
            blk_str := b::TEXT;
            lot_str := l::TEXT;
            addr := 'Block ' || blk_str || ' Lot ' || lot_str || ', Grand Enclave Residences';
            lot_sz := 180.00 + ((b * 7 + l * 3) % 85);
            flr_sz := lot_sz + 45.00;
            
            INSERT INTO properties (block_number, lot_number, unit_address, lot_area_sqm, floor_area_sqm, carport_capacity, curb_parallel_allowance, occupancy)
            VALUES (blk_str, lot_str, addr, lot_sz, flr_sz, 2, 1, 'OWNER_OCCUPIED')
            ON CONFLICT (block_number, lot_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 3. Sample Demo Profiles (Pre-seeded with fixed UUIDs for development)
INSERT INTO profiles (id, property_id, first_name, last_name, email, phone_number, role, is_primary_contact)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'Carlos', 'Valdez', 'admin@enclavehoa.com', '+63 917 555 0101', 'SUPER_ADMIN', true),
    ('c0000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000004', 'Ma. Elena', 'Cruz', 'treasurer@enclavehoa.com', '+63 918 555 0102', 'TREASURER', true),
    ('c0000000-0000-0000-0000-000000000003', NULL, 'Rodrigo', 'Bautista', 'guard@enclavehoa.com', '+63 919 555 0103', 'GUARD', false),
    ('c0000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000001', 'Juan', 'Dela Cruz', 'resident@enclavehoa.com', '+63 920 555 0104', 'RESIDENT', true),
    ('c0000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 'Victoria', 'Santos', 'victoria.santos@gmail.com', '+63 922 555 0105', 'RESIDENT', true),
    ('c0000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000003', 'Michael', 'Reyes', 'mreyes@corp.ph', '+63 923 555 0106', 'RESIDENT', false),
    ('c0000000-0000-0000-0000-000000000007', 'b3000000-0000-0000-0000-000000000008', 'Renato', 'Lim', 'rlim@hospital.ph', '+63 927 555 0107', 'RESIDENT', true),
    ('c0000000-0000-0000-0000-000000000008', 'b4000000-0000-0000-0000-000000000011', 'Sofia', 'Gonzaga', 'sofia.gonzaga@yahoo.com', '+63 928 555 0108', 'RESIDENT', false),
    ('c0000000-0000-0000-0000-000000000009', 'b5000000-0000-0000-0000-000000000005', 'Gabriel', 'Tan', 'gabriel.tan@tech.ph', '+63 917 555 0109', 'RESIDENT', true),
    ('c0000000-0000-0000-0000-000000000010', NULL, 'Eduardo', 'Ramos', 'guard2@enclavehoa.com', '+63 919 555 0110', 'GUARD', false)
ON CONFLICT (id) DO UPDATE SET
    property_id = EXCLUDED.property_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;

-- 4. Sample Vehicles (Enforcing designated slot policies)
INSERT INTO vehicles (id, property_id, plate_number, rfid_tag_no, make_model, color, designated_parking, sticker_valid_year, is_active)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'NDX 4821', 'RFID-GE-00124', 'Toyota Fortuner (Black)', 'Black', 'IN_GARAGE', 2026, true),
    ('d0000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'ABC 9988', 'RFID-GE-00125', 'Honda Civic (White)', 'Pearl White', 'CARPORT_CURB_PARALLEL', 2026, true),
    ('d0000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'NAA 1234', 'RFID-GE-00001', 'Mazda CX-5 (Soul Red)', 'Soul Red', 'IN_GARAGE', 2026, true),
    ('d0000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'NBP 7711', 'RFID-GE-00044', 'Ford Everest (Silver)', 'Silver', 'IN_GARAGE', 2026, true)
ON CONFLICT (property_id, plate_number) DO NOTHING;

-- 5. Sample Registered Domestic Pets with Rabies Vaccination
INSERT INTO pets (id, property_id, owner_id, name, species, breed, color_markings, is_vaccinated, vaccination_expiry_date, vaccine_card_url, is_active)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Mochi', 'DOG', 'Golden Retriever', 'Golden/White chest patch', true, '2026-11-30', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', true),
    ('e0000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Luna', 'CAT', 'British Shorthair', 'Grey Smoke', true, '2026-09-15', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', true),
    ('e0000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'Kobe', 'DOG', 'French Bulldog', 'Brindle', true, '2026-05-10', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Sample Community Violations Logged by Security
INSERT INTO community_violations (id, property_id, violation_category, plate_number, pet_id, photo_evidence_url, incident_location, notes, fine_amount, status, reported_by_guard_id)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'NOT_ABOVE_CURB_PARALLEL', 'WXX 1029', NULL, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400', 'In front of Block 1 Lot 3', 'Vehicle parked into roadway without mounting curbside elevation, blocking mother village garbage truck path.', 500.00, 'FINE_ASSESSED', 'c0000000-0000-0000-0000-000000000003'),
    ('f0000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'UNCOLLECTED_PET_WASTE', NULL, 'e0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400', 'Parkway Green Strip Block 1', 'Dog waste left on lawn near lot 4 corner. Security footage matched French Bulldog handler.', 500.00, 'WARNING_ISSUED', 'c0000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- 7. Sample Invoices
INSERT INTO invoices (
    id, property_id, billing_period, lot_area_snapshot, rate_per_sqm_snapshot,
    sqm_amount, base_fixed_amount, mother_village_amount, special_assessments,
    penalty_amount, violation_fines_amount, total_due, due_date, status, notes
)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'b2000000-0000-0000-0000-000000000001',
        '2026-08',
        260.00,
        25.00,
        6500.00, -- 260 * 25
        500.00,
        300.00,
        0.00,
        0.00,
        0.00,
        7300.00,
        '2026-08-15',
        'PAID',
        'Paid via GCash Ref: 98172635123'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'b2000000-0000-0000-0000-000000000001',
        '2026-09',
        260.00,
        25.00,
        6500.00,
        500.00,
        300.00,
        0.00,
        0.00,
        0.00,
        7300.00,
        '2026-09-15',
        'UNPAID',
        'Current statement for September 2026'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'b1000000-0000-0000-0000-000000000003',
        '2026-08',
        180.00,
        25.00,
        4500.00,
        500.00,
        300.00,
        0.00,
        0.00,
        500.00, -- Curb parking fine included
        5800.00,
        '2026-08-15',
        'PENDING_VERIFICATION',
        'Proof uploaded by tenant'
    )
ON CONFLICT (property_id, billing_period) DO NOTHING;

-- 8. Sample Amenity Reservations
INSERT INTO reservations (id, property_id, resident_id, amenity, start_time, end_time, guest_count, purpose, rental_fee, deposit_amount, status, admin_remarks)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        'b2000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000004',
        'MULTIFUNCTION_HALL',
        '2026-08-28 14:00:00+08',
        '2026-08-28 19:00:00+08',
        25,
        'Daughter 7th Birthday Party Celebration',
        3500.00,
        1500.00,
        'CONFIRMED',
        'Approved by Admin Carlos Valdez'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'b1000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000005',
        'SWIMMING_POOL',
        '2026-08-30 09:00:00+08',
        '2026-08-30 12:00:00+08',
        8,
        'Family morning swim & gathering',
        1000.00,
        500.00,
        'PENDING',
        'Awaiting deposit verification'
    )
ON CONFLICT (id) DO NOTHING;

-- 9. Sample Visitor Passes
INSERT INTO visitor_passes (id, property_id, visitor_name, plate_number, expected_arrival, valid_until, pass_code, status, checked_in_at, checked_by_guard_id)
VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        'b2000000-0000-0000-0000-000000000001',
        'Ricardo Morales (Catering Crew)',
        'NBI 5543',
        '2026-08-28 12:00:00+08',
        '2026-08-28 21:00:00+08',
        'GE-8921',
        'ACTIVE',
        NULL,
        NULL
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        'b1000000-0000-0000-0000-000000000001',
        'Lalamove Courier',
        '123-NCR',
        '2026-08-22 14:00:00+08',
        '2026-08-22 16:00:00+08',
        'GE-4019',
        'CHECKED_OUT',
        '2026-08-22 14:15:00+08',
        'c0000000-0000-0000-0000-000000000003'
    )
ON CONFLICT (id) DO NOTHING;

-- 10. Sample Service Tickets
INSERT INTO tickets (id, property_id, created_by, category, subject, description, status, admin_response)
VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        'b2000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000004',
        'MAINTENANCE',
        'Flickering streetlight outside Block 2 Lot 1',
        'The LED solar lamp post lamp flickers persistently between 8PM and 11PM.',
        'IN_PROGRESS',
        'Maintenance crew dispatched for inspection on Monday.'
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        'b1000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000005',
        'PET_VIOLATION',
        'Dispute regarding warning notice on poop-scoop policy',
        'Clarifying that Kobe was on backyard leash at timestamp mentioned in report.',
        'RESOLVED',
        'Security reviewed footage and resolved warning with notice.'
    )
ON CONFLICT (id) DO NOTHING;

-- 11. Announcements & Bulletins
INSERT INTO announcements (id, title, content, is_urgent, published_by, created_at)
VALUES
    (
        '50000000-0000-0000-0000-000000000001',
        'Main Gate RFID System Upgrades - Aug 25 to 27',
        'Please be advised that subdivision administration will conduct boom barrier calibrations on the main avenue. All homeowners are advised to present physical RFID cards if tap scanner is on bypass mode.',
        true,
        'c0000000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '1 day'
    ),
    (
        '50000000-0000-0000-0000-000000000002',
        'Annual Rabies Vaccination Drive & Pet Registration Drive',
        'The HOA Board has scheduled a licensed veterinary team to be on-site at the Clubhouse on Saturday, September 5th from 8:00 AM to 12:00 PM for free anti-rabies inoculations and vaccine certificate issuance. Ensure all domestic pets are registered via the resident portal.',
        false,
        'c0000000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '3 days'
    ),
    (
        '50000000-0000-0000-0000-000000000003',
        'Carport & Curbside Parking Advisory: Strict 1-Curb Parallel Vehicle Limit',
        'Security patrols will strictly enforce curbside parking alignment. Vehicles parked along village roads must be positioned parallel directly above your unit carport curb to preserve two-way road access for emergency vehicles.',
        false,
        'c0000000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '7 days'
    )
ON CONFLICT (id) DO NOTHING;
