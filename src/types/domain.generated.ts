// Generated from the applied app schema by tools/generate-domain-types.mjs. Do not edit.
// Decimal numeric and bigint values cross the API boundary as strings to preserve precision.
export type DomainJson = string | number | boolean | null | { [key: string]: DomainJson | undefined } | DomainJson[];
export interface DomainDatabase {
  app: {
    Tables: {
      "access_applications": {
        Row: {
          "id": string;
          "tenant_id": string;
          "applicant_id": string;
          "display_name": string;
          "requested_property": string;
          "status": string;
          "reviewed_by_membership_id": string | null;
          "reason": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "applicant_id": string;
          "display_name": string;
          "requested_property": string;
          "status"?: string;
          "reviewed_by_membership_id"?: string | null;
          "reason"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "applicant_id"?: string;
          "display_name"?: string;
          "requested_property"?: string;
          "status"?: string;
          "reviewed_by_membership_id"?: string | null;
          "reason"?: string | null;
          "created_at"?: string;
        };
      };
      "announcement_acknowledgments": {
        Row: {
          "tenant_id": string;
          "announcement_id": string;
          "membership_id": string;
          "acknowledged_at": string;
        };
        Insert: {
          "tenant_id": string;
          "announcement_id": string;
          "membership_id": string;
          "acknowledged_at"?: string;
        };
        Update: {
          "tenant_id"?: string;
          "announcement_id"?: string;
          "membership_id"?: string;
          "acknowledged_at"?: string;
        };
      };
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
          "cancelled_at": string | null;
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
          "cancelled_at"?: string | null;
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
          "cancelled_at"?: string | null;
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
      "association_setup": {
        Row: {
          "tenant_id": string;
          "created_by_operator": string;
          "administrator_id": string;
          "reviewed_by_operator": string | null;
          "sandbox": boolean;
          "address": string;
          "brand_name": string;
          "accent_color": string;
          "billing_day": number;
          "notification_contact": string;
          "support_contact": string;
          "privacy_notice_ref": string;
          "authority_ref": string;
          "opening_balance_state": string;
          "revision": number;
          "submitted_revision": number | null;
          "approved_revision": number | null;
          "approved_at": string | null;
          "created_at": string;
        };
        Insert: {
          "tenant_id": string;
          "created_by_operator": string;
          "administrator_id": string;
          "reviewed_by_operator"?: string | null;
          "sandbox"?: boolean;
          "address"?: string;
          "brand_name"?: string;
          "accent_color"?: string;
          "billing_day"?: number;
          "notification_contact"?: string;
          "support_contact"?: string;
          "privacy_notice_ref"?: string;
          "authority_ref"?: string;
          "opening_balance_state"?: string;
          "revision"?: number;
          "submitted_revision"?: number | null;
          "approved_revision"?: number | null;
          "approved_at"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "tenant_id"?: string;
          "created_by_operator"?: string;
          "administrator_id"?: string;
          "reviewed_by_operator"?: string | null;
          "sandbox"?: boolean;
          "address"?: string;
          "brand_name"?: string;
          "accent_color"?: string;
          "billing_day"?: number;
          "notification_contact"?: string;
          "support_contact"?: string;
          "privacy_notice_ref"?: string;
          "authority_ref"?: string;
          "opening_balance_state"?: string;
          "revision"?: number;
          "submitted_revision"?: number | null;
          "approved_revision"?: number | null;
          "approved_at"?: string | null;
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
          "audience": string;
          "purpose": string;
          "ticket_id": string | null;
          "previous_version_id": string | null;
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
          "audience"?: string;
          "purpose"?: string;
          "ticket_id"?: string | null;
          "previous_version_id"?: string | null;
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
          "audience"?: string;
          "purpose"?: string;
          "ticket_id"?: string | null;
          "previous_version_id"?: string | null;
        };
      };
      "finance_allocations": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "debit_id": string;
          "credit_id": string;
          "amount": string;
          "request_id": string;
          "reversal_of": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "debit_id": string;
          "credit_id": string;
          "amount": string;
          "request_id": string;
          "reversal_of"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "property_id"?: string;
          "debit_id"?: string;
          "credit_id"?: string;
          "amount"?: string;
          "request_id"?: string;
          "reversal_of"?: string | null;
          "created_at"?: string;
        };
      };
      "finance_batches": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "period": string;
          "total": string;
          "line_count": number;
          "fingerprint": string;
          "cancelled": boolean;
        };
        Insert: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "period": string;
          "total": string;
          "line_count": number;
          "fingerprint": string;
          "cancelled"?: boolean;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "period"?: string;
          "total"?: string;
          "line_count"?: number;
          "fingerprint"?: string;
          "cancelled"?: boolean;
        };
      };
      "finance_entries": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "request_id": string;
          "line_id": string | null;
          "kind": string;
          "amount": string;
          "posted_on": string;
          "due_on": string;
          "label": string;
          "snapshot": DomainJson;
          "reversal_of": string | null;
          "receipt_number": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "request_id": string;
          "line_id"?: string | null;
          "kind": string;
          "amount": string;
          "posted_on": string;
          "due_on": string;
          "label": string;
          "snapshot": DomainJson;
          "reversal_of"?: string | null;
          "receipt_number"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "property_id"?: string;
          "request_id"?: string;
          "line_id"?: string | null;
          "kind"?: string;
          "amount"?: string;
          "posted_on"?: string;
          "due_on"?: string;
          "label"?: string;
          "snapshot"?: DomainJson;
          "reversal_of"?: string | null;
          "receipt_number"?: string | null;
          "created_at"?: string;
        };
      };
      "finance_lines": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "batch_id": string;
          "property_id": string;
          "rule_id": string;
          "amount": string;
          "snapshot": DomainJson;
          "due_on": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "batch_id": string;
          "property_id": string;
          "rule_id": string;
          "amount": string;
          "snapshot": DomainJson;
          "due_on": string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "batch_id"?: string;
          "property_id"?: string;
          "rule_id"?: string;
          "amount"?: string;
          "snapshot"?: DomainJson;
          "due_on"?: string;
        };
      };
      "finance_periods": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "period": string;
          "closed": boolean;
          "changed_by_request": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "period": string;
          "closed"?: boolean;
          "changed_by_request": string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "period"?: string;
          "closed"?: boolean;
          "changed_by_request"?: string;
        };
      };
      "finance_policies": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "revision": number;
          "approval_limit": string;
          "created_at": string;
        };
        Insert: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "revision": number;
          "approval_limit": string;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "revision"?: number;
          "approval_limit"?: string;
          "created_at"?: string;
        };
      };
      "finance_requests": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "kind": string;
          "payload": DomainJson;
          "prepared_by": string;
          "reason": string;
          "status": string;
          "decided_by": string | null;
          "decision_reason": string | null;
          "created_at": string;
          "decided_at": string | null;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "kind": string;
          "payload": DomainJson;
          "prepared_by": string;
          "reason": string;
          "status"?: string;
          "decided_by"?: string | null;
          "decision_reason"?: string | null;
          "created_at"?: string;
          "decided_at"?: string | null;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "kind"?: string;
          "payload"?: DomainJson;
          "prepared_by"?: string;
          "reason"?: string;
          "status"?: string;
          "decided_by"?: string | null;
          "decision_reason"?: string | null;
          "created_at"?: string;
          "decided_at"?: string | null;
        };
      };
      "finance_rules": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "code": string;
          "label": string;
          "basis": string;
          "rate": string;
          "effective_from": string;
          "effective_until": string | null;
          "recurring": boolean;
          "category": string;
          "asset_kind": DomainDatabase["app"]["Enums"]["asset_kind"] | null;
          "grace_days": number;
          "cap": string | null;
          "due_days": number;
        };
        Insert: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "code": string;
          "label": string;
          "basis": string;
          "rate": string;
          "effective_from": string;
          "effective_until"?: string | null;
          "recurring": boolean;
          "category": string;
          "asset_kind"?: DomainDatabase["app"]["Enums"]["asset_kind"] | null;
          "grace_days"?: number;
          "cap"?: string | null;
          "due_days"?: number;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "code"?: string;
          "label"?: string;
          "basis"?: string;
          "rate"?: string;
          "effective_from"?: string;
          "effective_until"?: string | null;
          "recurring"?: boolean;
          "category"?: string;
          "asset_kind"?: DomainDatabase["app"]["Enums"]["asset_kind"] | null;
          "grace_days"?: number;
          "cap"?: string | null;
          "due_days"?: number;
        };
      };
      "finance_sequences": {
        Row: {
          "tenant_id": string;
          "next_number": string;
        };
        Insert: {
          "tenant_id": string;
          "next_number"?: string;
        };
        Update: {
          "tenant_id"?: string;
          "next_number"?: string;
        };
      };
      "finance_submissions": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "submitted_by": string;
          "amount": string;
          "paid_on": string;
          "method": string;
          "reference": string;
          "document_id": string;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "submitted_by": string;
          "amount": string;
          "paid_on": string;
          "method": string;
          "reference": string;
          "document_id": string;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "property_id"?: string;
          "submitted_by"?: string;
          "amount"?: string;
          "paid_on"?: string;
          "method"?: string;
          "reference"?: string;
          "document_id"?: string;
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
      "invitations": {
        Row: {
          "id": string;
          "tenant_id": string;
          "person_id": string;
          "email": string;
          "token_hash": string;
          "created_by_membership_id": string;
          "expires_at": string;
          "accepted_at": string | null;
          "revoked_at": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "person_id": string;
          "email": string;
          "token_hash": string;
          "created_by_membership_id": string;
          "expires_at": string;
          "accepted_at"?: string | null;
          "revoked_at"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "person_id"?: string;
          "email"?: string;
          "token_hash"?: string;
          "created_by_membership_id"?: string;
          "expires_at"?: string;
          "accepted_at"?: string | null;
          "revoked_at"?: string | null;
          "created_at"?: string;
        };
      };
      "lifecycle_events": {
        Row: {
          "id": string;
          "tenant_id": string;
          "actor_id": string;
          "event_type": string;
          "details": DomainJson;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "actor_id": string;
          "event_type": string;
          "details"?: DomainJson;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "actor_id"?: string;
          "event_type"?: string;
          "details"?: DomainJson;
          "created_at"?: string;
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
          "revoked_at": string | null;
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
          "revoked_at"?: string | null;
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
          "revoked_at"?: string | null;
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
          "ticket_notifications": boolean;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "person_id": string;
          "status"?: DomainDatabase["app"]["Enums"]["membership_status"];
          "valid_from": string;
          "valid_until"?: string | null;
          "created_at"?: string;
          "ticket_notifications"?: boolean;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "person_id"?: string;
          "status"?: DomainDatabase["app"]["Enums"]["membership_status"];
          "valid_from"?: string;
          "valid_until"?: string | null;
          "created_at"?: string;
          "ticket_notifications"?: boolean;
        };
      };
      "offboarding_requests": {
        Row: {
          "id": string;
          "tenant_id": string;
          "requested_by_membership_id": string;
          "export_id": string;
          "reason": string;
          "status": string;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "requested_by_membership_id": string;
          "export_id": string;
          "reason": string;
          "status"?: string;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "requested_by_membership_id"?: string;
          "export_id"?: string;
          "reason"?: string;
          "status"?: string;
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
          "external_key": string | null;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "kind"?: DomainDatabase["app"]["Enums"]["person_kind"];
          "display_name": string;
          "contact_email"?: string | null;
          "auth_user_id"?: string | null;
          "created_at"?: string;
          "external_key"?: string | null;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "kind"?: DomainDatabase["app"]["Enums"]["person_kind"];
          "display_name"?: string;
          "contact_email"?: string | null;
          "auth_user_id"?: string | null;
          "created_at"?: string;
          "external_key"?: string | null;
        };
      };
      "platform_operators": {
        Row: {
          "auth_user_id": string;
          "enabled": boolean;
        };
        Insert: {
          "auth_user_id": string;
          "enabled"?: boolean;
        };
        Update: {
          "auth_user_id"?: string;
          "enabled"?: boolean;
        };
      };
      "platform_requests": {
        Row: {
          "id": string;
          "actor_id": string;
          "operation": string;
          "idempotency_key": string;
          "request_sha256": string;
          "result": DomainJson | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "actor_id": string;
          "operation": string;
          "idempotency_key": string;
          "request_sha256": string;
          "result"?: DomainJson | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "actor_id"?: string;
          "operation"?: string;
          "idempotency_key"?: string;
          "request_sha256"?: string;
          "result"?: DomainJson | null;
          "created_at"?: string;
        };
      };
      "privacy_controls": {
        Row: {
          "tenant_id": string;
          "document_retention_days": number;
          "legal_hold": boolean;
          "updated_by": string;
          "updated_at": string;
        };
        Insert: {
          "tenant_id": string;
          "document_retention_days": number;
          "legal_hold": boolean;
          "updated_by": string;
          "updated_at"?: string;
        };
        Update: {
          "tenant_id"?: string;
          "document_retention_days"?: number;
          "legal_hold"?: boolean;
          "updated_by"?: string;
          "updated_at"?: string;
        };
      };
      "privacy_requests": {
        Row: {
          "id": string;
          "tenant_id": string;
          "requester_id": string;
          "kind": string;
          "detail": string;
          "status": string;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "requester_id": string;
          "kind": string;
          "detail": string;
          "status"?: string;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "requester_id"?: string;
          "kind"?: string;
          "detail"?: string;
          "status"?: string;
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
      "registry_exports": {
        Row: {
          "id": string;
          "tenant_id": string;
          "created_by_membership_id": string;
          "snapshot": DomainJson;
          "expires_at": string;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "created_by_membership_id": string;
          "snapshot": DomainJson;
          "expires_at"?: string;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "created_by_membership_id"?: string;
          "snapshot"?: DomainJson;
          "expires_at"?: string;
          "created_at"?: string;
        };
      };
      "resident_announcements": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string | null;
          "author_id": string;
          "title": string;
          "body": string;
          "created_at": string;
          "expires_at": string;
          "publish_at": string;
          "previous_id": string | null;
          "document_id": string | null;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "property_id"?: string | null;
          "author_id": string;
          "title": string;
          "body": string;
          "created_at"?: string;
          "expires_at": string;
          "publish_at"?: string;
          "previous_id"?: string | null;
          "document_id"?: string | null;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "property_id"?: string | null;
          "author_id"?: string;
          "title"?: string;
          "body"?: string;
          "created_at"?: string;
          "expires_at"?: string;
          "publish_at"?: string;
          "previous_id"?: string | null;
          "document_id"?: string | null;
        };
      };
      "resident_tickets": {
        Row: {
          "id": string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "requester_id": string;
          "description": string;
          "status": string;
          "assignee_id": string | null;
          "escalated_at": string | null;
          "response_due_at": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "community_id": string;
          "property_id": string;
          "requester_id": string;
          "description": string;
          "status"?: string;
          "assignee_id"?: string | null;
          "escalated_at"?: string | null;
          "response_due_at"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "community_id"?: string;
          "property_id"?: string;
          "requester_id"?: string;
          "description"?: string;
          "status"?: string;
          "assignee_id"?: string | null;
          "escalated_at"?: string | null;
          "response_due_at"?: string | null;
          "created_at"?: string;
        };
      };
      "support_access": {
        Row: {
          "id": string;
          "tenant_id": string;
          "operator_id": string;
          "approved_by_membership_id": string;
          "reason": string;
          "starts_at": string;
          "expires_at": string;
          "revoked_at": string | null;
        };
        Insert: {
          "id"?: string;
          "tenant_id": string;
          "operator_id": string;
          "approved_by_membership_id": string;
          "reason": string;
          "starts_at"?: string;
          "expires_at": string;
          "revoked_at"?: string | null;
        };
        Update: {
          "id"?: string;
          "tenant_id"?: string;
          "operator_id"?: string;
          "approved_by_membership_id"?: string;
          "reason"?: string;
          "starts_at"?: string;
          "expires_at"?: string;
          "revoked_at"?: string | null;
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
