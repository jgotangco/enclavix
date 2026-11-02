/** New domain types. The legacy database.ts is for the isolated prototype only. */
import type { DomainDatabase } from './domain.generated';
export type { DomainDatabase, DomainJson } from './domain.generated';
export type Tenant = DomainDatabase['app']['Tables']['tenants']['Row'];
export type Community = DomainDatabase['app']['Tables']['communities']['Row'];
export type DomainProperty = DomainDatabase['app']['Tables']['properties']['Row'];
export type Person = DomainDatabase['app']['Tables']['people']['Row'];
export type Membership = DomainDatabase['app']['Tables']['memberships']['Row'];
