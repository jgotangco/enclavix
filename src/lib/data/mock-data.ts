import { 
  Property, 
  Profile, 
  Vehicle, 
  Pet, 
  Violation, 
  BillingSetting, 
  Invoice, 
  Reservation, 
  VisitorPass, 
  Ticket, 
  Announcement 
} from "@/types/database";

// Initial Billing Settings
export const INITIAL_BILLING_SETTINGS: BillingSetting = {
  id: "a0000000-0000-0000-0000-000000000001",
  rate_per_sqm: 25.00,
  base_fixed_fee: 500.00,
  mother_village_fee: 300.00,
  late_penalty_percent: 5.00,
  standard_fine_amount: 500.00,
  due_day_of_month: 15,
  is_active: true,
  updated_at: new Date().toISOString(),
};

// Generate 150 Lots for Grand Enclave Residences (Blocks 1-8)
export function generateInitialProperties(): Property[] {
  const properties: Property[] = [];
  const blockCounts = [20, 20, 20, 20, 20, 20, 20, 10]; // Total: 150 lots across Blocks 1-8

  blockCounts.forEach((totalLots, blockIndex) => {
    const b = blockIndex + 1;
    for (let l = 1; l <= totalLots; l++) {
      const id = `b${b}000000-0000-0000-0000-${String(l).padStart(12, "0")}`;
      const blkStr = String(b);
      const lotStr = String(l);
      const lotArea = 180 + ((b * 7 + l * 3) % 85); // 180 to 265 sqm
      const floorArea = lotArea + 45;

      let occupancy: Property["occupancy"] = "OWNER_OCCUPIED";
      if (l === 3 || l === 11 || l === 17) occupancy = "TENANTED";
      if ((b === 1 && l === 6) || (b === 8 && l === 9)) occupancy = "VACANT_LOT";

      properties.push({
        id,
        block_number: blkStr,
        lot_number: lotStr,
        unit_address: `Block ${blkStr} Lot ${lotStr}, Grand Enclave Residences`,
        lot_area_sqm: lotArea,
        floor_area_sqm: floorArea,
        carport_capacity: 2,
        curb_parallel_allowance: 1,
        occupancy,
        notes: (b === 2 && l === 1) ? "HOA President Residence" : (b === 3 && l === 4) ? "Treasurer Residence" : null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      });
    }
  });

  return properties;
}

export const INITIAL_PROPERTIES = generateInitialProperties();

// Comprehensive User Accounts & Membership Database
export const INITIAL_USERS: Profile[] = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    property_id: null, // Super admin is independent and does not require a lot
    first_name: "Carlos",
    last_name: "Valdez",
    email: "admin@enclavehoa.com",
    phone_number: "+63 917 555 0101",
    mobile_number: "+63 917 555 0101",
    emergency_contact: "+63 2 8800 1000",
    role: "SUPER_ADMIN",
    officer_position: "NONE", // Independent Admin
    affiliation_type: "HOA_EMPLOYEE",
    is_primary_contact: false,
    occupancy_type: "STAFF",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    property_id: "b3000000-0000-0000-0000-000000000004", // Block 3 Lot 4
    first_name: "Ma. Elena",
    last_name: "Cruz",
    email: "treasurer@enclavehoa.com",
    phone_number: "+63 918 555 0102",
    mobile_number: "+63 918 555 0102",
    emergency_contact: "+63 917 111 2222",
    role: "TREASURER",
    officer_position: "TREASURER_OFFICER",
    affiliation_type: "HOMEOWNER",
    is_primary_contact: true,
    occupancy_type: "OFFICER",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    property_id: null,
    first_name: "Rodrigo",
    last_name: "Bautista",
    email: "guard@enclavehoa.com",
    phone_number: "+63 919 555 0103",
    mobile_number: "+63 919 555 0103",
    emergency_contact: "+63 2 8800 1001",
    role: "GUARD",
    officer_position: "NONE",
    affiliation_type: "SECURITY_PERSONNEL",
    is_primary_contact: false,
    occupancy_type: "STAFF",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    first_name: "Juan",
    last_name: "Dela Cruz",
    email: "resident@enclavehoa.com",
    phone_number: "+63 920 555 0104",
    mobile_number: "+63 920 555 0104",
    emergency_contact: "+63 917 888 7777",
    role: "RESIDENT",
    officer_position: "PRESIDENT", // HOA President, but access role is Resident
    affiliation_type: "HOMEOWNER",
    is_primary_contact: true,
    occupancy_type: "OWNER",
    is_active: true,
    created_at: "2026-01-05T00:00:00Z",
    updated_at: "2026-01-05T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000005",
    property_id: "b1000000-0000-0000-0000-000000000004", // Block 1 Lot 4
    first_name: "Victoria",
    last_name: "Santos",
    email: "victoria.santos@gmail.com",
    phone_number: "+63 922 555 0105",
    mobile_number: "+63 922 555 0105",
    emergency_contact: "+63 917 222 3333",
    role: "RESIDENT",
    officer_position: "SECRETARY", // HOA Secretary
    affiliation_type: "HOMEOWNER",
    is_primary_contact: true,
    occupancy_type: "OWNER",
    is_active: true,
    created_at: "2026-01-10T00:00:00Z",
    updated_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000006",
    property_id: "b2000000-0000-0000-0000-000000000003", // Block 2 Lot 3
    first_name: "Michael",
    last_name: "Reyes",
    email: "mreyes@corp.ph",
    phone_number: "+63 923 555 0106",
    mobile_number: "+63 923 555 0106",
    emergency_contact: "+63 917 444 3322",
    role: "RESIDENT",
    officer_position: "NONE",
    affiliation_type: "TENANT",
    is_primary_contact: false,
    occupancy_type: "TENANT",
    is_active: true,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000007",
    property_id: "b3000000-0000-0000-0000-000000000008", // Block 3 Lot 8
    first_name: "Renato",
    last_name: "Lim",
    email: "rlim@hospital.ph",
    phone_number: "+63 927 555 0107",
    mobile_number: "+63 927 555 0107",
    emergency_contact: "+63 917 999 1111",
    role: "RESIDENT",
    officer_position: "BOARD_MEMBER",
    affiliation_type: "HOMEOWNER",
    is_primary_contact: true,
    occupancy_type: "OWNER",
    is_active: true,
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-02-15T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000008",
    property_id: "b4000000-0000-0000-0000-000000000011", // Block 4 Lot 11
    first_name: "Sofia",
    last_name: "Gonzaga",
    email: "sofia.gonzaga@yahoo.com",
    phone_number: "+63 928 555 0108",
    mobile_number: "+63 928 555 0108",
    emergency_contact: "+63 917 555 9900",
    role: "RESIDENT",
    officer_position: "NONE",
    affiliation_type: "TENANT",
    is_primary_contact: false,
    occupancy_type: "TENANT",
    is_active: true,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000009",
    property_id: "b5000000-0000-0000-0000-000000000005", // Block 5 Lot 5
    first_name: "Gabriel",
    last_name: "Tan",
    email: "gabriel.tan@tech.ph",
    phone_number: "+63 917 555 0109",
    mobile_number: "+63 917 555 0109",
    emergency_contact: "+63 917 333 4455",
    role: "RESIDENT",
    officer_position: "COMMITTEE_HEAD",
    affiliation_type: "HOMEOWNER",
    is_primary_contact: true,
    occupancy_type: "OWNER",
    is_active: true,
    created_at: "2026-03-10T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000010",
    property_id: null,
    first_name: "Eduardo",
    last_name: "Ramos",
    email: "guard2@enclavehoa.com",
    phone_number: "+63 919 555 0110",
    mobile_number: "+63 919 555 0110",
    emergency_contact: "+63 2 8800 1001",
    role: "GUARD",
    officer_position: "NONE",
    affiliation_type: "SECURITY_PERSONNEL",
    is_primary_contact: false,
    occupancy_type: "STAFF",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-0000-0000-000000000011",
    property_id: null,
    first_name: "Maricel",
    last_name: "Dizon",
    email: "staff@enclavehoa.com",
    phone_number: "+63 917 555 0111",
    mobile_number: "+63 917 555 0111",
    emergency_contact: "+63 2 8800 1000",
    role: "SUPER_ADMIN",
    officer_position: "PROPERTY_MANAGER",
    affiliation_type: "HOA_EMPLOYEE",
    is_primary_contact: false,
    occupancy_type: "STAFF",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }
];

// Initial Vehicles
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: "d0000000-0000-0000-0000-000000000001",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    plate_number: "NDX 4821",
    vehicle_type: "SUV",
    rfid_tag_no: "RFID-GE-00124",
    make_model: "Toyota Fortuner 2.8 LTD",
    color: "Attitude Black",
    driver_name: "Juan Dela Cruz",
    or_cr_number: "ORCR-2025-981241",
    designated_parking: "IN_GARAGE",
    sticker_valid_year: 2026,
    is_active: true,
    created_at: "2026-01-15T08:00:00Z",
  },
  {
    id: "d0000000-0000-0000-0000-000000000002",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    plate_number: "ABC 9988",
    vehicle_type: "SEDAN",
    rfid_tag_no: "RFID-GE-00125",
    make_model: "Honda Civic RS Turbo",
    color: "Platinum White Pearl",
    driver_name: "Maria Dela Cruz",
    or_cr_number: "ORCR-2024-551920",
    designated_parking: "CARPORT_CURB_PARALLEL",
    sticker_valid_year: 2026,
    is_active: true,
    created_at: "2026-01-15T08:30:00Z",
  },
  {
    id: "d0000000-0000-0000-0000-000000000003",
    property_id: "b1000000-0000-0000-0000-000000000001", // Block 1 Lot 1
    plate_number: "NAA 1234",
    vehicle_type: "SUV",
    rfid_tag_no: "RFID-GE-00001",
    make_model: "Mazda CX-5 AWD",
    color: "Soul Red Crystal",
    driver_name: "Carlos Valdez",
    or_cr_number: "ORCR-2026-102941",
    designated_parking: "IN_GARAGE",
    sticker_valid_year: 2026,
    is_active: true,
    created_at: "2026-02-01T09:00:00Z",
  },
  {
    id: "d0000000-0000-0000-0000-000000000004",
    property_id: "b1000000-0000-0000-0000-000000000004", // Block 1 Lot 4
    plate_number: "NBP 7711",
    vehicle_type: "SUV",
    rfid_tag_no: "RFID-GE-00044",
    make_model: "Ford Everest Titanium",
    color: "Aluminium Metallic",
    driver_name: "Victoria Santos",
    or_cr_number: "ORCR-2025-449102",
    designated_parking: "IN_GARAGE",
    sticker_valid_year: 2026,
    is_active: true,
    created_at: "2026-02-10T10:00:00Z",
  },
  {
    id: "d0000000-0000-0000-0000-000000000005",
    property_id: "b3000000-0000-0000-0000-000000000001", // Block 3 Lot 1
    plate_number: "NFO 8832",
    vehicle_type: "SUV",
    rfid_tag_no: "RFID-GE-00088",
    make_model: "Mitsubishi Montero Sport GT",
    color: "Medium Grey Mica",
    driver_name: "Renato Lim",
    or_cr_number: "ORCR-2026-771890",
    designated_parking: "CARPORT_CURB_PARALLEL",
    sticker_valid_year: 2026,
    is_active: true,
    created_at: "2026-03-01T11:00:00Z",
  }
];

// Initial Domestic Pets
export const INITIAL_PETS: Pet[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    owner_id: "c0000000-0000-0000-0000-000000000004",
    name: "Mochi",
    species: "DOG",
    breed: "Golden Retriever",
    color_markings: "Golden / White chest patch",
    is_vaccinated: true,
    vaccination_expiry_date: "2026-11-30",
    vaccine_card_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600",
    is_active: true,
    created_at: "2026-01-10T00:00:00Z",
    updated_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    owner_id: "c0000000-0000-0000-0000-000000000004",
    name: "Luna",
    species: "CAT",
    breed: "British Shorthair",
    color_markings: "Grey Smoke",
    is_vaccinated: true,
    vaccination_expiry_date: "2026-09-15",
    vaccine_card_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600",
    is_active: true,
    created_at: "2026-01-12T00:00:00Z",
    updated_at: "2026-01-12T00:00:00Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    property_id: "b1000000-0000-0000-0000-000000000004", // Block 1 Lot 4
    owner_id: "c0000000-0000-0000-0000-000000000005",
    name: "Kobe",
    species: "DOG",
    breed: "French Bulldog",
    color_markings: "Brindle",
    is_vaccinated: true,
    vaccination_expiry_date: "2026-05-10",
    vaccine_card_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600",
    is_active: true,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000004",
    property_id: "b3000000-0000-0000-0000-000000000001", // Block 3 Lot 1
    owner_id: "c0000000-0000-0000-0000-000000000001",
    name: "Pebbles",
    species: "DOG",
    breed: "Shih Tzu",
    color_markings: "Tri-color White/Brown/Black",
    is_vaccinated: true,
    vaccination_expiry_date: "2027-01-20",
    vaccine_card_url: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600",
    is_active: true,
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-02-15T00:00:00Z",
  }
];

// Initial Invoices
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    billing_period: "2026-08",
    lot_area_snapshot: 260.00,
    rate_per_sqm_snapshot: 25.00,
    sqm_amount: 6500.00,
    base_fixed_amount: 500.00,
    mother_village_amount: 300.00,
    special_assessments: 0.00,
    penalty_amount: 0.00,
    violation_fines_amount: 0.00,
    total_due: 7300.00,
    due_date: "2026-08-15",
    status: "PAID",
    payment_method: "GCash",
    payment_reference_no: "GCASH-98172635123",
    proof_of_payment_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
    paid_amount: 7300.00,
    paid_at: "2026-08-12T14:30:00Z",
    verified_by: "c0000000-0000-0000-0000-000000000002",
    notes: "Official Receipt OR-2026-0881 generated",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    billing_period: "2026-09",
    lot_area_snapshot: 260.00,
    rate_per_sqm_snapshot: 25.00,
    sqm_amount: 6500.00,
    base_fixed_amount: 500.00,
    mother_village_amount: 300.00,
    special_assessments: 0.00,
    penalty_amount: 0.00,
    violation_fines_amount: 0.00,
    total_due: 7300.00,
    due_date: "2026-09-15",
    status: "UNPAID",
    payment_method: null,
    payment_reference_no: null,
    proof_of_payment_url: null,
    paid_amount: null,
    paid_at: null,
    verified_by: null,
    notes: "Current Statement for September 2026",
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    property_id: "b1000000-0000-0000-0000-000000000003", // Block 1 Lot 3
    billing_period: "2026-08",
    lot_area_snapshot: 180.00,
    rate_per_sqm_snapshot: 25.00,
    sqm_amount: 4500.00,
    base_fixed_amount: 500.00,
    mother_village_amount: 300.00,
    special_assessments: 0.00,
    penalty_amount: 0.00,
    violation_fines_amount: 500.00,
    total_due: 5800.00,
    due_date: "2026-08-15",
    status: "PENDING_VERIFICATION",
    payment_method: "GCash",
    payment_reference_no: "GCASH-991823481",
    proof_of_payment_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
    paid_amount: 5800.00,
    paid_at: "2026-08-18T10:00:00Z",
    verified_by: null,
    notes: "Awaiting Treasurer confirmation",
    created_at: "2026-08-01T00:00:00Z",
  }
];

// Initial Violations
export const INITIAL_VIOLATIONS: Violation[] = [
  {
    id: "f0000000-0000-0000-0000-000000000001",
    property_id: "b1000000-0000-0000-0000-000000000003",
    violation_category: "NOT_ABOVE_CURB_PARALLEL",
    plate_number: "WXX 1029",
    pet_id: null,
    photo_evidence_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600",
    incident_location: "In front of Block 1 Lot 3",
    notes: "Vehicle parked into roadway without mounting curbside elevation, blocking mother village garbage truck path.",
    fine_amount: 500.00,
    status: "FINE_ASSESSED",
    reported_by_guard_id: "c0000000-0000-0000-0000-000000000003",
    created_at: "2026-08-20T19:45:00Z",
  },
  {
    id: "f0000000-0000-0000-0000-000000000002",
    property_id: "b1000000-0000-0000-0000-000000000004",
    violation_category: "UNCOLLECTED_PET_WASTE",
    plate_number: null,
    pet_id: "e0000000-0000-0000-0000-000000000003",
    photo_evidence_url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600",
    incident_location: "Parkway Green Strip Block 1",
    notes: "Dog waste left on lawn near lot 4 corner. Security footage matched French Bulldog handler.",
    fine_amount: 500.00,
    status: "WARNING_ISSUED",
    reported_by_guard_id: "c0000000-0000-0000-0000-000000000003",
    created_at: "2026-08-19T07:15:00Z",
  }
];

// Initial Visitor Passes
export const INITIAL_VISITOR_PASSES: VisitorPass[] = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    visitor_name: "Ricardo Morales (Catering Crew)",
    plate_number: "NBI 5543",
    expected_arrival: "2026-08-28T12:00:00Z",
    valid_until: "2026-08-28T21:00:00Z",
    pass_code: "GE-8921",
    status: "ACTIVE",
    checked_in_at: null,
    checked_out_at: null,
    checked_by_guard_id: null,
    created_at: "2026-08-22T08:00:00Z",
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    property_id: "b1000000-0000-0000-0000-000000000001", // Block 1 Lot 1
    visitor_name: "Lalamove Courier",
    plate_number: "123-NCR",
    expected_arrival: "2026-08-22T14:00:00Z",
    valid_until: "2026-08-22T16:00:00Z",
    pass_code: "GE-4019",
    status: "CHECKED_OUT",
    checked_in_at: "2026-08-22T14:15:00Z",
    checked_out_at: "2026-08-22T14:35:00Z",
    checked_by_guard_id: "c0000000-0000-0000-0000-000000000003",
    created_at: "2026-08-22T10:00:00Z",
  },
  {
    id: "30000000-0000-0000-0000-000000000003",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    visitor_name: "Architect Miguel Sy",
    plate_number: "NDO 9912",
    expected_arrival: "2026-08-23T09:00:00Z",
    valid_until: "2026-08-23T12:00:00Z",
    pass_code: "GE-7721",
    status: "ACTIVE",
    checked_in_at: null,
    checked_out_at: null,
    checked_by_guard_id: null,
    created_at: "2026-08-22T11:00:00Z",
  }
];

// Initial Amenity Reservations
export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    amenity: "CLUBHOUSE_FUNCTION_ROOM",
    start_time: "2026-08-28T14:00:00Z",
    end_time: "2026-08-28T20:00:00Z",
    status: "CONFIRMED",
    estimated_guests: 35,
    event_purpose: "Family Birthday Celebration",
    deposit_amount: 2000.00,
    fee_amount: 3500.00,
    approved_by: "c0000000-0000-0000-0000-000000000001",
    notes: "Security deposit cleared. Caterer: Red Ribbon / Max's.",
    created_at: "2026-08-20T10:00:00Z",
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    property_id: "b1000000-0000-0000-0000-000000000001", // Block 1 Lot 1
    amenity: "SWIMMING_POOL_DECK",
    start_time: "2026-08-29T10:00:00Z",
    end_time: "2026-08-29T14:00:00Z",
    status: "PENDING_APPROVAL",
    estimated_guests: 12,
    event_purpose: "Kids Weekend Swim Gathering",
    deposit_amount: 1000.00,
    fee_amount: 1500.00,
    approved_by: null,
    notes: "Awaiting Admin approval and deposit confirmation.",
    created_at: "2026-08-21T11:30:00Z",
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    property_id: "b3000000-0000-0000-0000-000000000001", // Block 3 Lot 1
    amenity: "BBQ_GRILL_AREA",
    start_time: "2026-08-30T17:00:00Z",
    end_time: "2026-08-30T21:00:00Z",
    status: "CONFIRMED",
    estimated_guests: 15,
    event_purpose: "Sunday Evening BBQ Dinner",
    deposit_amount: 500.00,
    fee_amount: 800.00,
    approved_by: "c0000000-0000-0000-0000-000000000001",
    notes: "Approved.",
    created_at: "2026-08-21T16:00:00Z",
  }
];

// Initial Helpdesk Tickets
export const INITIAL_TICKETS: Ticket[] = [
  {
    id: "40000000-0000-0000-0000-000000000001",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    resident_id: "c0000000-0000-0000-0000-000000000004",
    category: "MAINTENANCE_REPAIR",
    subject: "Streetlight flickering outside Block 2 Lot 2",
    description: "The LED streetlight lamp on the corner post blinks rapidly at night, causing visibility issues.",
    photo_attachment_url: null,
    status: "IN_PROGRESS",
    assigned_to_id: "c0000000-0000-0000-0000-000000000003",
    resolution_notes: "Electrician scheduled for Saturday morning inspection.",
    created_at: "2026-08-21T18:00:00Z",
    updated_at: "2026-08-22T09:00:00Z",
  },
  {
    id: "40000000-0000-0000-0000-000000000002",
    property_id: "b1000000-0000-0000-0000-000000000004", // Block 1 Lot 4
    resident_id: "c0000000-0000-0000-0000-000000000005",
    category: "PARKING_DISPUTE",
    subject: "Delivery truck parked blocking driveway",
    description: "A contractor van remained parked directly across my driveway entrance for over 2 hours.",
    photo_attachment_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600",
    status: "RESOLVED",
    assigned_to_id: "c0000000-0000-0000-0000-000000000003",
    resolution_notes: "Guard advised driver to relocate to visitor parking near clubhouse.",
    created_at: "2026-08-20T11:00:00Z",
    updated_at: "2026-08-20T12:30:00Z",
  },
  {
    id: "40000000-0000-0000-0000-000000000003",
    property_id: "b2000000-0000-0000-0000-000000000001", // Block 2 Lot 1
    resident_id: "c0000000-0000-0000-0000-000000000004",
    category: "BILLING_INQUIRY",
    subject: "Inquiry regarding Mother Subdivision Fee rate",
    description: "Requesting clarification on the ₱300 mother subdivision component breakdown.",
    photo_attachment_url: null,
    status: "OPEN",
    assigned_to_id: "c0000000-0000-0000-0000-000000000002",
    resolution_notes: null,
    created_at: "2026-08-22T08:30:00Z",
    updated_at: "2026-08-22T08:30:00Z",
  }
];

// Initial Announcements
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "50000000-0000-0000-0000-000000000001",
    title: "Utility Scheduled Power Interruption Advisory",
    content: "Electric distribution utility has scheduled preventive maintenance work along Enclave Boulevard on Saturday, August 29, from 8:00 AM to 12:00 PM. The enclave standby backup generator will power perimeter security lighting and the Gate 1 boom barrier kiosk.",
    priority: "HIGH",
    is_pinned: true,
    published_by: "c0000000-0000-0000-0000-000000000001",
    created_at: "2026-08-21T09:00:00Z",
  },
  {
    id: "50000000-0000-0000-0000-000000000002",
    title: "Annual Community Anti-Rabies Vaccination Drive",
    content: "In partnership with the City Veterinary Department, free annual anti-rabies vaccinations and domestic pet microchipping will be conducted at the Clubhouse Garden Pavilion on Sunday, September 6, from 9:00 AM to 3:00 PM. Please bring your pet's current health card.",
    priority: "NORMAL",
    is_pinned: true,
    published_by: "c0000000-0000-0000-0000-000000000001",
    created_at: "2026-08-18T10:00:00Z",
  },
  {
    id: "50000000-0000-0000-0000-000000000003",
    title: "Mother Gate RFID Sensor Upgrade",
    content: "Subdivision administration has completed the firmware upgrade on the outer perimeter boom barriers. All registered RFID stickers (2026 valid series) are fully synchronized for seamless dual-gate entry.",
    priority: "NORMAL",
    is_pinned: false,
    published_by: "c0000000-0000-0000-0000-000000000001",
    created_at: "2026-08-15T14:00:00Z",
  }
];
