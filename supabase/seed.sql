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
