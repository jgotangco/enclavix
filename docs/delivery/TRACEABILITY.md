# Requirement traceability

S00 foundational containment and build evidence is in [evidence/S00.md](evidence/S00.md). No later-sprint requirement is marked complete by S00.

Each BRD requirement has one sprint accountable for completion evidence. Earlier sprints may establish prerequisites. All are initially unverified; completion evidence belongs in the assigned sprint report. Update verification state only with actual evidence.

| Requirement | Completion sprint | Verification state |
| --- | --- | --- |
| AND 01 | S07 | unverified |
| AND 02 | S07 | unverified |
| AND 03 | S07 | unverified |
| AND 04 | S07 | unverified |
| ARC 01 | S01 | Schema/path and S02 account/access controls verified; later workflow/operating controls pending S03–S10 |
| ARC 02 | S01 | Uniqueness/rollback foundation verified; posting/delivery pending S04/S05 |
| ARC 03 | S01 | Migration/type foundation verified; client compatibility pending S06/S10 |
| FIN 01 | S04 | unverified |
| FIN 02 | S04 | unverified |
| FIN 03 | S04 | unverified |
| FIN 04 | S04 | unverified |
| FIN 05 | S04 | unverified |
| FIN 06 | S04 | unverified |
| FIN 07 | S04 | unverified |
| FIN 08 | S04 | unverified |
| IAM 01 | S02 | Implemented; provider and final CI verification in S02 evidence; S02 engineering scope accepted; see evidence |
| IAM 02 | S02 | Forged-cookie/claim and native request checks implemented; S02 engineering scope accepted; see evidence |
| IAM 03 | S02 | Account/property/document service and RLS checks implemented; later modules remain denied |
| IAM 04 | S02 | MFA, absolute lifetimes and live session/membership checks implemented; S02 engineering scope accepted; see evidence |
| IAM 05 | S02 | Audited scoped role commands, no self-elevation and retry checks implemented; S02 engineering scope accepted; see evidence |
| IAM 06 | S02 | Approved expiring metadata-only support implemented; emergency impersonation disabled |
| IAM 07 | S02 | Context-scoped reads and state clearing implemented; Android device acceptance remains S06/S07 |
| NFR 01 | S10 | unverified |
| NFR 02 | S10 | unverified |
| NFR 03 | S10 | unverified |
| NFR 04 | S10 | unverified |
| NFR 05 | S10 | unverified |
| NFR 06 | S10 | unverified |
| NFR 07 | S10 | unverified |
| OPS 01 | S09 | unverified |
| OPS 02 | S09 | unverified |
| OPS 03 | S09 | unverified |
| OPS 04 | S09 | unverified |
| OPS 05 | S09 | unverified |
| OPS 06 | S09 | unverified |
| OPS 07 | S09 | unverified |
| OPS 08 | S09 | unverified |
| OPS 09 | S09 | unverified |
| OPS 10 | S09 | unverified |
| PRV 01 | S10 | unverified |
| REL 01 | S10 | unverified |
| REL 02 | S10 | unverified |
| REL 03 | S10 | unverified |
| SCP 01 | S10 | unverified |
| SCP 02 | S03 | unverified |
| SCP 03 | S10 | unverified |
| TEN 01 | S03 | unverified |
| TEN 02 | S03 | unverified |
| TEN 03 | S03 | unverified |
| TEN 04 | S03 | unverified |
| TEN 05 | S03 | unverified |
| TEN 06 | S03 | unverified |
| TEN 07 | S03 | unverified |
| UX 01 | S07 | unverified |
| UX 02 | S07 | unverified |
| UX 03 | S07 | unverified |


S01 is the architecture foundation evidence owner for ARC requirements. These requirements span later sprints; foundation verification is not full requirement completion. See [S01 evidence](evidence/S01.md) for implemented and deferred controls. No service authorization, financial posting, mobile compatibility or production rollout is marked complete here.

S02 engineering acceptance includes the four PR #3 review repairs and successful 58-test, web/demo, real Supabase and container verification. It does not accept later modules, production email/hosting configuration, independent security assessment or Android device behavior.
