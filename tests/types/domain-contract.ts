import type { DomainDatabase } from '../../src/types/domain.generated';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
type Tables = DomainDatabase['app']['Tables'];
export type ExactArea = Expect<Equal<Tables['properties']['Row']['lot_area_sqm'], string | null>>;
export type ExactFileSize = Expect<Equal<Tables['document_objects']['Row']['size_bytes'], string>>;
export type ImmutableGeneratedPath = Expect<Equal<Tables['document_objects']['Insert']['object_path'], undefined>>;
export type RequiredTenant = Expect<Equal<Tables['memberships']['Insert']['tenant_id'], string>>;
export type MemberStates = Expect<Equal<DomainDatabase['app']['Enums']['membership_status'], 'pending' | 'active' | 'suspended' | 'revoked'>>;
