// Generated from the applied app schema by tools/generate-domain-types.mjs. Do not edit.
// Decimal numeric and bigint values cross the API boundary as strings to preserve precision.
export type DomainJson = string | number | boolean | null | { [key: string]: DomainJson | undefined } | DomainJson[];
export interface DomainDatabase {
  app: {
    Tables: {
      "asset_allocations": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "asset_id": string;
          "property_id": string;
          "kind": DomainDatabase["app"]["Enums"]["allocation_kind"];
          "valid_from": string;
          "valid_until": string | null;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "asset_id": string;
          "property_id": string;
          "kind": DomainDatabase["app"]["Enums"]["allocation_kind"];
          "valid_from": string;
          "valid_until"?: string | null;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "asset_id"?: string;
          "property_id"?: string;
          "kind"?: DomainDatabase["app"]["Enums"]["allocation_kind"];
          "valid_from"?: string;
          "valid_until"?: string | null;
        };
      };
      "assets": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "location_id": string | null;
          "code": string;
          "label": string;
          "kind": DomainDatabase["app"]["Enums"]["asset_kind"];
          "capacity": number;
          "is_active": boolean;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "location_id"?: string | null;
          "code": string;
          "label": string;
          "kind": DomainDatabase["app"]["Enums"]["asset_kind"];
          "capacity"?: number;
          "is_active"?: boolean;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "location_id"?: string | null;
          "code"?: string;
          "label"?: string;
          "kind"?: DomainDatabase["app"]["Enums"]["asset_kind"];
          "capacity"?: number;
          "is_active"?: boolean;
          "created_at"?: string;
        };
      };
      "audit_events": {
        Row: {
          "id": string;
          "tenant_id": string;
          "actor_membership_id": string;
          "operation_id": string | null;
          "event_type": string;
          "outcome": string;
          "details": DomainJson;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "actor_membership_id": string;
          "operation_id"?: string | null;
          "event_type": string;
          "outcome": string;
          "details"?: DomainJson;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "actor_membership_id"?: string;
          "operation_id"?: string | null;
          "event_type"?: string;
          "outcome"?: string;
          "details"?: DomainJson;
          "created_at"?: string;
        };
      };
      "civic_designations": {
        Row: {
          "id": string;
          "tenant_id": string;
          "membership_id": string;
          "title": string;
          "valid_from": string;
          "valid_until": string | null;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "membership_id": string;
          "title": string;
          "valid_from": string;
          "valid_until"?: string | null;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "membership_id"?: string;
          "title"?: string;
          "valid_from"?: string;
          "valid_until"?: string | null;
        };
      };
      "communities": {
        Row: {
          "id": string;
          "tenant_id": string;
          "code": string;
          "name": string;
          "kind": DomainDatabase["app"]["Enums"]["community_kind"];
          "time_zone": string;
          "structure_labels": DomainJson;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "code": string;
          "name": string;
          "kind": DomainDatabase["app"]["Enums"]["community_kind"];
          "time_zone"?: string;
          "structure_labels"?: DomainJson;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "code"?: string;
          "name"?: string;
          "kind"?: DomainDatabase["app"]["Enums"]["community_kind"];
          "time_zone"?: string;
          "structure_labels"?: DomainJson;
          "created_at"?: string;
        };
      };
      "document_objects": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string | null;
          "property_id": string | null;
          "uploaded_by_membership_id": string;
          "storage_bucket": string;
          "object_path": string;
          "display_name": string;
          "content_type": string;
          "size_bytes": string;
          "sha256": string | null;
          "scan_status": DomainDatabase["app"]["Enums"]["scan_status"];
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id"?: string | null;
          "property_id"?: string | null;
          "uploaded_by_membership_id": string;
          "storage_bucket"?: string;
          "object_path"?: never;
          "display_name": string;
          "content_type": string;
          "size_bytes": string;
          "sha256"?: string | null;
          "scan_status"?: DomainDatabase["app"]["Enums"]["scan_status"];
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string | null;
          "property_id"?: string | null;
          "uploaded_by_membership_id"?: string;
          "storage_bucket"?: string;
          "object_path"?: never;
          "display_name"?: string;
          "content_type"?: string;
          "size_bytes"?: string;
          "sha256"?: string | null;
          "scan_status"?: DomainDatabase["app"]["Enums"]["scan_status"];
          "created_at"?: string;
        };
      };
      "import_batches": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string | null;
          "created_by_membership_id": string;
          "approved_by_membership_id": string | null;
          "idempotency_key": string;
          "source_sha256": string;
          "status": DomainDatabase["app"]["Enums"]["import_status"];
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id"?: string | null;
          "created_by_membership_id": string;
          "approved_by_membership_id"?: string | null;
          "idempotency_key": string;
          "source_sha256": string;
          "status"?: DomainDatabase["app"]["Enums"]["import_status"];
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string | null;
          "created_by_membership_id"?: string;
          "approved_by_membership_id"?: string | null;
          "idempotency_key"?: string;
          "source_sha256"?: string;
          "status"?: DomainDatabase["app"]["Enums"]["import_status"];
          "created_at"?: string;
        };
      };
      "import_rows": {
        Row: {
          "id": string;
          "tenant_id": string;
          "batch_id": string;
          "row_number": number;
          "record_kind": string;
          "raw_payload": DomainJson;
          "validated_payload": DomainJson | null;
          "issues": DomainJson;
          "status": DomainDatabase["app"]["Enums"]["import_row_status"];
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "batch_id": string;
          "row_number": number;
          "record_kind": string;
          "raw_payload": DomainJson;
          "validated_payload"?: DomainJson | null;
          "issues"?: DomainJson;
          "status"?: DomainDatabase["app"]["Enums"]["import_row_status"];
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "batch_id"?: string;
          "row_number"?: number;
          "record_kind"?: string;
          "raw_payload"?: DomainJson;
          "validated_payload"?: DomainJson | null;
          "issues"?: DomainJson;
          "status"?: DomainDatabase["app"]["Enums"]["import_row_status"];
        };
      };
      "locations": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "parent_location_id": string | null;
          "kind": DomainDatabase["app"]["Enums"]["location_kind"];
          "code": string;
          "label": string;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "parent_location_id"?: string | null;
          "kind": DomainDatabase["app"]["Enums"]["location_kind"];
          "code": string;
          "label": string;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "parent_location_id"?: string | null;
          "kind"?: DomainDatabase["app"]["Enums"]["location_kind"];
          "code"?: string;
          "label"?: string;
          "created_at"?: string;
        };
      };
      "membership_roles": {
        Row: {
          "id": string;
          "tenant_id": string;
          "membership_id": string;
          "role": DomainDatabase["app"]["Enums"]["system_role"];
          "community_id": string | null;
          "granted_by_membership_id": string | null;
          "valid_from": string;
          "valid_until": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "membership_id": string;
          "role": DomainDatabase["app"]["Enums"]["system_role"];
          "community_id"?: string | null;
          "granted_by_membership_id"?: string | null;
          "valid_from": string;
          "valid_until"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "membership_id"?: string;
          "role"?: DomainDatabase["app"]["Enums"]["system_role"];
          "community_id"?: string | null;
          "granted_by_membership_id"?: string | null;
          "valid_from"?: string;
          "valid_until"?: string | null;
          "created_at"?: string;
        };
      };
      "memberships": {
        Row: {
          "id": string;
          "tenant_id": string;
          "person_id": string;
          "status": DomainDatabase["app"]["Enums"]["membership_status"];
          "valid_from": string;
          "valid_until": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "person_id": string;
          "status"?: DomainDatabase["app"]["Enums"]["membership_status"];
          "valid_from": string;
          "valid_until"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "person_id"?: string;
          "status"?: DomainDatabase["app"]["Enums"]["membership_status"];
          "valid_from"?: string;
          "valid_until"?: string | null;
          "created_at"?: string;
        };
      };
      "operation_requests": {
        Row: {
          "id": string;
          "tenant_id": string;
          "actor_membership_id": string;
          "operation": string;
          "idempotency_key": string;
          "request_sha256": string;
          "status": DomainDatabase["app"]["Enums"]["operation_status"];
          "result": DomainJson | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "actor_membership_id": string;
          "operation": string;
          "idempotency_key": string;
          "request_sha256": string;
          "status"?: DomainDatabase["app"]["Enums"]["operation_status"];
          "result"?: DomainJson | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "actor_membership_id"?: string;
          "operation"?: string;
          "idempotency_key"?: string;
          "request_sha256"?: string;
          "status"?: DomainDatabase["app"]["Enums"]["operation_status"];
          "result"?: DomainJson | null;
          "created_at"?: string;
        };
      };
      "outbox_events": {
        Row: {
          "id": string;
          "tenant_id": string;
          "operation_id": string;
          "sequence": number;
          "event_type": string;
          "payload": DomainJson;
          "status": DomainDatabase["app"]["Enums"]["delivery_status"];
          "attempts": number;
          "available_at": string;
          "lease_token": string | null;
          "leased_until": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "operation_id": string;
          "sequence": number;
          "event_type": string;
          "payload": DomainJson;
          "status"?: DomainDatabase["app"]["Enums"]["delivery_status"];
          "attempts"?: number;
          "available_at"?: string;
          "lease_token"?: string | null;
          "leased_until"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "operation_id"?: string;
          "sequence"?: number;
          "event_type"?: string;
          "payload"?: DomainJson;
          "status"?: DomainDatabase["app"]["Enums"]["delivery_status"];
          "attempts"?: number;
          "available_at"?: string;
          "lease_token"?: string | null;
          "leased_until"?: string | null;
          "created_at"?: string;
        };
      };
      "people": {
        Row: {
          "id": string;
          "tenant_id": string;
          "kind": DomainDatabase["app"]["Enums"]["person_kind"];
          "display_name": string;
          "contact_email": string | null;
          "auth_user_id": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "kind"?: DomainDatabase["app"]["Enums"]["person_kind"];
          "display_name": string;
          "contact_email"?: string | null;
          "auth_user_id"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "kind"?: DomainDatabase["app"]["Enums"]["person_kind"];
          "display_name"?: string;
          "contact_email"?: string | null;
          "auth_user_id"?: string | null;
          "created_at"?: string;
        };
      };
      "properties": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "location_id": string | null;
          "code": string;
          "label": string;
          "kind": DomainDatabase["app"]["Enums"]["property_kind"];
          "lot_area_sqm": string | null;
          "floor_area_sqm": string | null;
          "ownership_share": string | null;
          "is_active": boolean;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "location_id"?: string | null;
          "code": string;
          "label": string;
          "kind": DomainDatabase["app"]["Enums"]["property_kind"];
          "lot_area_sqm"?: string | null;
          "floor_area_sqm"?: string | null;
          "ownership_share"?: string | null;
          "is_active"?: boolean;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "location_id"?: string | null;
          "code"?: string;
          "label"?: string;
          "kind"?: DomainDatabase["app"]["Enums"]["property_kind"];
          "lot_area_sqm"?: string | null;
          "floor_area_sqm"?: string | null;
          "ownership_share"?: string | null;
          "is_active"?: boolean;
          "created_at"?: string;
        };
      };
      "property_relationships": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "person_id": string;
          "represented_person_id": string | null;
          "kind": DomainDatabase["app"]["Enums"]["relationship_kind"];
          "is_primary_contact": boolean;
          "is_billing_responsible": boolean;
          "valid_from": string;
          "valid_until": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "person_id": string;
          "represented_person_id"?: string | null;
          "kind": DomainDatabase["app"]["Enums"]["relationship_kind"];
          "is_primary_contact"?: boolean;
          "is_billing_responsible"?: boolean;
          "valid_from": string;
          "valid_until"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "property_id"?: string;
          "person_id"?: string;
          "represented_person_id"?: string | null;
          "kind"?: DomainDatabase["app"]["Enums"]["relationship_kind"];
          "is_primary_contact"?: boolean;
          "is_billing_responsible"?: boolean;
          "valid_from"?: string;
          "valid_until"?: string | null;
          "created_at"?: string;
        };
      };
      "tenants": {
        Row: {
          "id": string;
          "tenant_key": string;
          "legal_name": string;
          "status": DomainDatabase["app"]["Enums"]["tenant_status"];
          "currency": string;
          "time_zone": string;
          "locale": string;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_key": string;
          "legal_name": string;
          "status"?: DomainDatabase["app"]["Enums"]["tenant_status"];
          "currency"?: string;
          "time_zone"?: string;
          "locale"?: string;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_key"?: string;
          "legal_name"?: string;
          "status"?: DomainDatabase["app"]["Enums"]["tenant_status"];
          "currency"?: string;
          "time_zone"?: string;
          "locale"?: string;
          "created_at"?: string;
        };
      };
    };
    Enums: {
      "allocation_kind": "ownership" | "use";
      "asset_kind": "parking" | "storage" | "amenity" | "elevator" | "gate";
      "community_kind": "village" | "condominium";
      "delivery_status": "pending" | "processing" | "delivered" | "failed";
      "import_row_status": "pending" | "valid" | "invalid" | "approved" | "applied";
      "import_status": "staged" | "validated" | "approved" | "committed" | "failed" | "cancelled";
      "location_kind": "phase" | "block" | "tower" | "floor";
      "membership_status": "pending" | "active" | "suspended" | "revoked";
      "operation_status": "pending" | "succeeded" | "failed";
      "person_kind": "individual" | "organization";
      "property_kind": "lot" | "townhouse_unit" | "condominium_unit";
      "relationship_kind": "owner" | "tenant" | "occupant" | "representative";
      "scan_status": "pending" | "quarantined" | "clean" | "rejected";
      "system_role": "association_admin" | "finance_preparer" | "finance_approver" | "guard" | "facilities_staff" | "board_reviewer" | "resident";
      "tenant_status": "onboarding" | "active" | "suspended" | "closed";
    };
  };
}
