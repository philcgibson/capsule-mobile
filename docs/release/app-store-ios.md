# iOS App Store release draft

This is a review-ready content draft, not an approved legal or marketing claim set. Replace every bracketed value before submission. The first binary keeps Explore disabled and presents Capsule as private and invite-only.

## Proposed listing

- **Name:** Capsule
- **Subtitle:** Private memories, together
- **Primary category:** Lifestyle
- **Secondary category:** Photo & Video
- **Version:** 1.0.0
- **Copyright:** 2026 [LEGAL OWNER]
- **Privacy policy:** [HTTPS PRIVACY URL]
- **Support URL:** [HTTPS SUPPORT URL]
- **Marketing URL:** [HTTPS PRODUCT URL]

### Promotional text

Gather photos, notes, and the small details that make a life feel like yours—privately, together, and over time.

### Description

Capsule is a private home for the moments you want to keep.

Create a capsule for a birthday, trip, family chapter, creative project, or everyday collection. Add photos and notes as they happen, then return to the complete story in a clean grid or chronological timeline.

Invite the people who were there with a revocable guest link. They can add a photo or note from their browser without creating an account or installing the app.

CAPSULE INCLUDES

- Private capsules for photos and notes
- Grid and timeline views
- Browser guest contributions
- Revocable invite links
- Capsule and memory editing
- Account, capsule, and memory deletion controls
- Private media delivered through expiring links

Capsule is private by default. Public discovery is not included in this release.

### Keywords draft

`memories,photo,journal,family,archive,album,story,private,shared,moments,keepsake`

### Version notes

Welcome to Capsule 1.0: create private memory capsules, add photos and notes, invite guests, and revisit everything in grid or timeline view.

## App Review information

- **Contact:** [REVIEW CONTACT NAME]
- **Email:** [REVIEW CONTACT EMAIL]
- **Phone:** [REVIEW CONTACT PHONE]
- **Demo username:** [DEDICATED REVIEW ACCOUNT]
- **Demo password:** [APP STORE CONNECT SECRET — NEVER COMMIT]

Suggested review notes:

> Capsule is a private, invite-only memory app. Sign in with the supplied review account. The account contains review-safe sample capsules. Open a capsule to inspect grid and timeline views, add a note or photo, and create a guest link. Open the guest link in Safari to submit a contribution without another account. Public discovery is disabled in this build. Account deletion is available from the profile screen and requires the current password.

The review account must be a real production account with non-personal, licensed sample photography. Do not enable `/api/v1/auth/test-user` in production or disclose a shared developer password.

## Screenshot set

Capture five real app screens in portrait at an Apple-accepted 6.9-inch resolution. Apple currently accepts `1260×2736`, `1290×2796`, or `1320×2868` pixels for this display class. Provide the highest-resolution set once; App Store Connect can scale it for smaller iPhone sizes when the interface is the same.

| Order | Real source screen | Overlay copy | Evidence required |
| --- | --- | --- | --- |
| 1 | Capsule library grid | Life, gathered. | Three polished, review-safe capsules; no debug UI |
| 2 | Capsule timeline | Every memory, in context. | Real notes/photos and chronological events |
| 3 | Capsule grid view | See the whole story your way. | Working grid/timeline control |
| 4 | Invite controls | Bring everyone into the moment. | Revocable guest link workflow |
| 5 | New capsule | Private from the start. | Honest empty cover state and private-default copy |

Apple permits one to ten screenshots in PNG or JPEG. Screenshots must show the implemented app, not decorative substitute screens. Source requirements: [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) and [upload guidance](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots).

## Before metadata upload

- Confirm the legal owner and copyright text.
- Publish privacy, terms, marketing, and support URLs.
- Complete App Privacy answers against actual production data flows.
- Confirm the age-rating questionnaire; do not infer answers from this draft.
- Create the App Store Connect app record with bundle ID `com.phil-stradx.capsule`.
- Configure an App Store Connect API key or Apple credentials in EAS.
- Create the dedicated review account and rehearse the exact notes above.
- Capture screenshots from a release/TestFlight build, not the Expo development client.
- Run internal TestFlight testing on physical devices before App Review.
