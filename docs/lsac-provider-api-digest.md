# LSAC LawHub Provider API Digest

This document captures the data model and API relationships used by LSAC's LawHub Provider API so the team has a stable in-repo reference.

Source reference: `LawHub Provider API Technical Documentation (Draft), Feb 19, 2026`.

## Core entities

### Vendor

- You (Better LSAT) are a vendor integration partner.
- Identified by `vendorId`.
- Every vendor endpoint is scoped by `vendorId`.

Path shape:

`{{BASE_URL}}/api/vendor/{vendorId}/...`

### Student

- A person with a LawHub account.
- Identified in requests by email during invite/lookup workflows.
- Not the primary ID for ongoing integration calls.

### Vendor-Student Link (`studentCoachingId`)

- The most important LSAC identifier for this integration.
- `studentCoachingId` is the unique ID for the relationship between one vendor and one student.
- This is not a global student/person ID.
- Preferred key for refresh, upgrade, logging, deep-link launches, and test instance retrieval.

Equivalent naming used in docs:

- Path placeholder: `{coachingId}`
- Response field: `studentCoachingId`

### Test Instance

- A completed or in-progress LawHub assessment attempt for a linked student.
- Identified by `testInstanceId`.
- Contains section-level and response-level details.

### Log Event

- Audit event submitted by vendor to LSAC (for example, login/content access).
- Must include `studentCoachingId`, event type/date, and optional metadata.

## Relationship model

Conceptual relationships:

- `Vendor (1) -> VendorStudentLink (many)`
- `Student (1) -> VendorStudentLink (many)`
- `VendorStudentLink (1) -> TestInstance (many)`
- `TestInstance (1) -> SectionResult (many)`
- `SectionResult (1) -> ItemResponse (many)`

Practical implication:

- Store `studentCoachingId` on your local profile record and treat it as the canonical external ID.

## Endpoint map by entity

### Create or mutate link records

- `POST /api/vendor/{vendorId}/students`
  - Add/invite student and create or renew vendor-student link.
  - Returns `studentCoachingId` and current coaching/subscription fields.

- `POST /api/vendor/{vendorId}/upgradeStudent/{studentCoachingId}`
  - Upgrade or extend student subscription state on an existing link.

### Read link records

- `GET /api/vendor/{vendorId}/students/{coachingId}`
  - Preferred read path for one linked student.

- `GET /api/vendor/{vendorId}/studentEmails/{emailAddress}`
  - Lookup by email when `studentCoachingId` is unknown.

- `GET /api/vendor/{vendorId}/students`
  - Full vendor roster of linked students.

### Read results and submit audit events

- `GET /api/vendor/{vendorId}/students/{studentCoachingId}/instances`
  - Fetch test instances and detailed responses for a linked student.

- `POST /api/vendor/{vendorId}/log`
  - Required LSAC content-access logging endpoint.

## Typical integration lifecycle

1. Obtain OAuth token using client credentials.
2. Invite/add student via `POST /students`.
3. Persist returned `studentCoachingId` in local profile.
4. Launch deep link using `vendorId + studentCoachingId + testId`.
5. Log content access via `POST /log`.
6. Pull results via `GET /students/{studentCoachingId}/instances`.
7. Refresh/upgrade linkage state as needed.

## Product paths (Better LSAT)

| Student choice | Stripe | LawHub `POST /students` flags |
|----------------|--------|-------------------------------|
| Subscribe with Better LSAT (LawHub included) | Active Core/Live subscription required | `isPrepPlusRequired=true`, `isPrepPlusIncludedFromVendor=true` |
| Already have LawHub PrepPlus | Active Core/Live subscription required (no $99 LawHub line item at checkout) | `isPrepPlusRequired=true`, `isPrepPlusIncludedFromVendor=false` |

Dashboard access requires **both** an active Better LSAT subscription and `linked === true` on the latest LSAC snapshot (coach link accepted in LawHub).

Local profile field `prep_plus_source`: `vendor_subscription` or `existing_lsac` (records how PrepPlus is sourced; does not bypass billing).

## Data fields to persist locally

Recommended fields to store in local profile/snapshot tables:

- `studentCoachingId`
- `emailAddress`
- `firstName`, `lastName`
- `linked`
- `coachingStartDate`, `coachingExpirationDate`
- `subscriptionType`
- `subscriptionStartDate`, `subscriptionExpirationDate`
- `isPrepPlusRequired`
- `isPrepPlusIncludedFromVendor`

## Environment and auth notes

- Sandbox base URL: `https://providers-api-sandbox.lawhub.org`
- Production base URL: `https://providers-api.lawhub.org`
- Token endpoint: `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`
- Required token params: `grant_type=client_credentials`, `client_id`, `client_secret`, `scope`
- Token use: `Authorization: Bearer {access_token}`

Security requirement:

- Keep LSAC credentials server-side only (Edge Functions/secrets), never browser or `VITE_*`.
