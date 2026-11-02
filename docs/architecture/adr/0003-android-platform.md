# ADR 0003 Android platform comparison

Date: 1 November 2026. State: recommendation only; D04 and D05 remain proposed. Owners: product and engineering leads. Requirements: AND 01–04, UX 01–03, ARC 03. No Android app or platform dependency is introduced in S01.

| Criterion | Kotlin with Jetpack Compose | React Native |
| --- | --- | --- |
| Initial Android-only goal | Direct fit to Android lifecycle, UI and device APIs | Supports Android and a possible later iOS client with a common React codebase |
| Team reuse | Requires Kotlin/Gradle capability; shares API contracts and business services | Reuses TypeScript/React skills; web components are not automatically reusable native components |
| Secure storage and device integration | Direct use of platform Keystore-backed mechanisms and native camera/deep-link APIs | Requires suitable native libraries and dependency maintenance; AsyncStorage is not secure credential storage |
| Resident UI | Native Compose navigation, accessibility and adaptive layout work | Native React components with explicit navigation, accessibility and platform testing |
| Managed guard mode | Native integration is straightforward to evaluate | Native modules may still be needed for device-management requirements |
| Maintenance evidence needed | Build/signing pipeline, supported SDK/device matrix and Kotlin ownership | Native dependency compatibility, React Native upgrade policy and release builds on actual devices |

Provisional recommendation: evaluate Kotlin/Compose first because Android is the only committed mobile platform and later managed guard operation needs direct platform integration. React Native remains a credible alternative if the delivery team and future iOS roadmap make shared React skills more valuable. This is a judgment to test, not a security or delivery-speed claim. A desktop TypeScript proof does not demonstrate mobile readiness.

Before S06 commitment, run the same bounded spike in the shortlisted approach: system-browser login/return link, secure session handling and logout, push permission denied/granted, interrupted evidence upload, community switching without cache leakage, TalkBack, text scaling, a midrange physical device and a signed release build. Measure build time, task success and dependency risks. Record device/network details and actual owners. Approve the stack and minimum Android version before implementation; Android 10 remains a proposal subject to device survey and current Play requirements.

No business rules or privileged credentials belong in either mobile client. Money, approvals and gate admission stay authoritative in the shared services. Future platform changes do not require tenant-specific backends or code forks.

Sources checked 1 November 2026: [Android Compose-first guidance](https://developer.android.com/develop/ui/compose/first), [Android architecture recommendations](https://developer.android.com/topic/architecture/recommendations), [Android Keystore](https://developer.android.com/privacy-and-security/keystore), [React Native security](https://reactnative.dev/docs/security).
