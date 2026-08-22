export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OfficerPosition = 
  | 'PRESIDENT' 
  | 'VICE_PRESIDENT' 
  | 'SECRETARY' 
  | 'TREASURER_OFFICER' 
  | 'AUDITOR' 
  | 'BOARD_MEMBER' 
  | 'COMMITTEE_HEAD' 
  | 'PROPERTY_MANAGER' 
  | 'NONE';

export type AffiliationType = 
  | 'HOMEOWNER' 
  | 'TENANT' 
  | 'HOA_EMPLOYEE' 
  | 'PROPERTY_STAFF' 
  | 'SECURITY_PERSONNEL' 
  | 'EXTERNAL_VENDOR';

export type UserRole = 'SUPER_ADMIN' | 'TREASURER' | 'GUARD' | 'RESIDENT';
export type OccupancyStatus = 'OWNER_OCCUPIED' | 'TENANTED' | 'VACANT_LOT';
export type InvoiceStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type ReservationStatus = 'PENDING' | 'PENDING_APPROVAL' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketCategory =
  | 'MAINTENANCE'
  | 'SECURITY'
  | 'BILLING'
  | 'PARKING_VIOLATION'
  | 'PET_VIOLATION'
  | 'COMPLAINT'
  | 'GENERAL'
  | 'MAINTENANCE_REPAIR'
  | 'SECURITY_INCIDENT'
  | 'PET_COMPLAINT'
  | 'PARKING_DISPUTE'
  | 'BILLING_INQUIRY'
  | 'GENERAL_INQUIRY';
export type AmenityType = 
  | 'MULTIFUNCTION_HALL' 
  | 'SWIMMING_POOL' 
  | 'CLUBHOUSE_FUNCTION_ROOM' 
  | 'SWIMMING_POOL_DECK' 
  | 'GARDEN_PAVILION' 
  | 'BBQ_GRILL_AREA';
export type ParkingSlotType = 'IN_GARAGE' | 'CARPORT_CURB_PARALLEL';
export type VehicleType = 'SEDAN' | 'SUV' | 'VAN' | 'HATCHBACK' | 'PICKUP' | 'MOTORCYCLE' | 'EV' | 'OTHER';
export type PetSpecies = 'DOG' | 'CAT' | 'OTHER_DOMESTICATED';
export type ViolationType =
  | 'EXCEEDED_CURB_PARKING'
  | 'NOT_ABOVE_CURB_PARALLEL'
  | 'ROAD_OBSTRUCTION'
  | 'UNCOLLECTED_PET_WASTE'
  | 'OFF_LEASH_PET'
  | 'EXOTIC_OR_NON_DOMESTIC_ANIMAL'
  | 'PET_NOISE_DISTURBANCE';
export type ViolationStatus = 'WARNING_ISSUED' | 'FINE_ASSESSED' | 'RESOLVED' | 'DISPUTED';

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          block_number: string;
          lot_number: string;
          unit_address: string;
          lot_area_sqm: number;
          floor_area_sqm: number | null;
          carport_capacity: number;
          curb_parallel_allowance: number;
          occupancy: OccupancyStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          block_number: string;
          lot_number: string;
          unit_address: string;
          lot_area_sqm: number;
          floor_area_sqm?: number | null;
          carport_capacity?: number;
          curb_parallel_allowance?: number;
          occupancy?: OccupancyStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          block_number?: string;
          lot_number?: string;
          unit_address?: string;
          lot_area_sqm?: number;
          floor_area_sqm?: number | null;
          carport_capacity?: number;
          curb_parallel_allowance?: number;
          occupancy?: OccupancyStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          property_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone_number: string | null;
          mobile_number?: string | null;
          emergency_contact?: string | null;
          role: UserRole;
          officer_position?: OfficerPosition;
          affiliation_type?: AffiliationType;
          is_primary_contact: boolean;
          occupancy_type?: 'OWNER' | 'TENANT' | 'OFFICER' | 'STAFF';
          is_active?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          property_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone_number?: string | null;
          mobile_number?: string | null;
          emergency_contact?: string | null;
          role?: UserRole;
          officer_position?: OfficerPosition;
          affiliation_type?: AffiliationType;
          is_primary_contact?: boolean;
          occupancy_type?: 'OWNER' | 'TENANT' | 'OFFICER' | 'STAFF';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone_number?: string | null;
          mobile_number?: string | null;
          emergency_contact?: string | null;
          role?: UserRole;
          officer_position?: OfficerPosition;
          affiliation_type?: AffiliationType;
          is_primary_contact?: boolean;
          occupancy_type?: 'OWNER' | 'TENANT' | 'OFFICER' | 'STAFF';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          property_id: string;
          plate_number: string;
          vehicle_type?: VehicleType;
          rfid_tag_no: string | null;
          make_model: string | null;
          color: string | null;
          driver_name?: string | null;
          or_cr_number?: string | null;
          designated_parking: ParkingSlotType;
          sticker_valid_year: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          plate_number: string;
          vehicle_type?: VehicleType;
          rfid_tag_no?: string | null;
          make_model?: string | null;
          color?: string | null;
          driver_name?: string | null;
          or_cr_number?: string | null;
          designated_parking?: ParkingSlotType;
          sticker_valid_year?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          plate_number?: string;
          vehicle_type?: VehicleType;
          rfid_tag_no?: string | null;
          make_model?: string | null;
          color?: string | null;
          driver_name?: string | null;
          or_cr_number?: string | null;
          designated_parking?: ParkingSlotType;
          sticker_valid_year?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      pets: {
        Row: {
          id: string;
          property_id: string;
          owner_id: string;
          name: string;
          species: PetSpecies;
          breed: string | null;
          color_markings: string | null;
          is_vaccinated: boolean;
          vaccination_expiry_date: string | null;
          vaccine_card_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          owner_id: string;
          name: string;
          species?: PetSpecies;
          breed?: string | null;
          color_markings?: string | null;
          is_vaccinated?: boolean;
          vaccination_expiry_date?: string | null;
          vaccine_card_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          owner_id?: string;
          name?: string;
          species?: PetSpecies;
          breed?: string | null;
          color_markings?: string | null;
          is_vaccinated?: boolean;
          vaccination_expiry_date?: string | null;
          vaccine_card_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_violations: {
        Row: {
          id: string;
          property_id: string | null;
          violation_category: ViolationType;
          plate_number: string | null;
          pet_id: string | null;
          photo_evidence_url: string | null;
          incident_location: string | null;
          notes: string | null;
          fine_amount: number;
          status: ViolationStatus;
          reported_by_guard_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          violation_category: ViolationType;
          plate_number?: string | null;
          pet_id?: string | null;
          photo_evidence_url?: string | null;
          incident_location?: string | null;
          notes?: string | null;
          fine_amount?: number;
          status?: ViolationStatus;
          reported_by_guard_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          violation_category?: ViolationType;
          plate_number?: string | null;
          pet_id?: string | null;
          photo_evidence_url?: string | null;
          incident_location?: string | null;
          notes?: string | null;
          fine_amount?: number;
          status?: ViolationStatus;
          reported_by_guard_id?: string | null;
          created_at?: string;
        };
      };
      billing_settings: {
        Row: {
          id: string;
          rate_per_sqm: number;
          base_fixed_fee: number;
          mother_village_fee: number;
          late_penalty_percent: number;
          standard_fine_amount: number;
          due_day_of_month: number;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rate_per_sqm?: number;
          base_fixed_fee?: number;
          mother_village_fee?: number;
          late_penalty_percent?: number;
          standard_fine_amount?: number;
          due_day_of_month?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rate_per_sqm?: number;
          base_fixed_fee?: number;
          mother_village_fee?: number;
          late_penalty_percent?: number;
          standard_fine_amount?: number;
          due_day_of_month?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          property_id: string;
          billing_period: string;
          lot_area_snapshot: number;
          rate_per_sqm_snapshot: number;
          sqm_amount: number;
          base_fixed_amount: number;
          mother_village_amount: number;
          special_assessments: number;
          penalty_amount: number;
          violation_fines_amount: number;
          total_due: number;
          due_date: string;
          status: InvoiceStatus;
          payment_method: string | null;
          payment_reference_no: string | null;
          proof_of_payment_url: string | null;
          paid_amount: number | null;
          paid_at: string | null;
          verified_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          billing_period: string;
          lot_area_snapshot: number;
          rate_per_sqm_snapshot: number;
          sqm_amount: number;
          base_fixed_amount: number;
          mother_village_amount: number;
          special_assessments?: number;
          penalty_amount?: number;
          violation_fines_amount?: number;
          total_due: number;
          due_date: string;
          status?: InvoiceStatus;
          payment_method?: string | null;
          payment_reference_no?: string | null;
          proof_of_payment_url?: string | null;
          paid_amount?: number | null;
          paid_at?: string | null;
          verified_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          billing_period?: string;
          lot_area_snapshot?: number;
          rate_per_sqm_snapshot?: number;
          sqm_amount?: number;
          base_fixed_amount?: number;
          mother_village_amount?: number;
          special_assessments?: number;
          penalty_amount?: number;
          violation_fines_amount?: number;
          total_due?: number;
          due_date?: string;
          status?: InvoiceStatus;
          payment_method?: string | null;
          payment_reference_no?: string | null;
          proof_of_payment_url?: string | null;
          paid_amount?: number | null;
          paid_at?: string | null;
          verified_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          property_id: string;
          resident_id?: string;
          amenity: AmenityType;
          start_time: string;
          end_time: string;
          guest_count?: number;
          estimated_guests?: number;
          purpose?: string | null;
          event_purpose?: string;
          rental_fee?: number;
          fee_amount?: number;
          deposit_amount: number;
          status: ReservationStatus;
          admin_remarks?: string | null;
          approved_by?: string | null;
          notes?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          resident_id?: string;
          amenity: AmenityType;
          start_time: string;
          end_time: string;
          guest_count?: number;
          estimated_guests?: number;
          purpose?: string | null;
          event_purpose?: string;
          rental_fee?: number;
          fee_amount?: number;
          deposit_amount?: number;
          status?: ReservationStatus;
          admin_remarks?: string | null;
          approved_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          resident_id?: string;
          amenity?: AmenityType;
          start_time?: string;
          end_time?: string;
          guest_count?: number;
          estimated_guests?: number;
          purpose?: string | null;
          event_purpose?: string;
          rental_fee?: number;
          fee_amount?: number;
          deposit_amount?: number;
          status?: ReservationStatus;
          admin_remarks?: string | null;
          approved_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      visitor_passes: {
        Row: {
          id: string;
          property_id: string;
          visitor_name: string;
          plate_number: string | null;
          expected_arrival: string;
          valid_until: string;
          pass_code: string;
          status: string;
          checked_in_at: string | null;
          checked_out_at: string | null;
          checked_by_guard_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          visitor_name: string;
          plate_number?: string | null;
          expected_arrival: string;
          valid_until: string;
          pass_code: string;
          status?: string;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          checked_by_guard_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          visitor_name?: string;
          plate_number?: string | null;
          expected_arrival?: string;
          valid_until?: string;
          pass_code?: string;
          status?: string;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          checked_by_guard_id?: string | null;
          created_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          property_id: string;
          created_by?: string;
          resident_id?: string;
          category: TicketCategory;
          subject: string;
          description: string;
          status: TicketStatus;
          photo_attachment_url?: string | null;
          assigned_to_id?: string | null;
          resolution_notes?: string | null;
          admin_response?: string | null;
          resolved_at?: string | null;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          created_by?: string;
          resident_id?: string;
          category?: TicketCategory;
          subject: string;
          description: string;
          status?: TicketStatus;
          photo_attachment_url?: string | null;
          assigned_to_id?: string | null;
          resolution_notes?: string | null;
          admin_response?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          created_by?: string;
          resident_id?: string;
          category?: TicketCategory;
          subject?: string;
          description?: string;
          status?: TicketStatus;
          photo_attachment_url?: string | null;
          assigned_to_id?: string | null;
          resolution_notes?: string | null;
          admin_response?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
          is_pinned?: boolean;
          is_urgent?: boolean;
          published_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
          is_pinned?: boolean;
          is_urgent?: boolean;
          published_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
          is_pinned?: boolean;
          is_urgent?: boolean;
          published_by?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Property = Database['public']['Tables']['properties']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type Pet = Database['public']['Tables']['pets']['Row'];
export type Violation = Database['public']['Tables']['community_violations']['Row'];
export type BillingSetting = Database['public']['Tables']['billing_settings']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type Reservation = Database['public']['Tables']['reservations']['Row'];
export type VisitorPass = Database['public']['Tables']['visitor_passes']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'];
