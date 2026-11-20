# AOLO Driver Agent Instructions

## Project overview

- This is an Expo/React Native TypeScript driver app for AOLO Cabs.
- Use React 19, React Native 0.88, Expo SDK, React Navigation, Zustand, TanStack Query, Axios, Zod, React Hook Form, and the packages already declared in `package.json`.
- Do not add packages or replace approved libraries without an explicit request. The README's approved-library list is in `README.md`.
- Keep changes compatible with Expo Go where native-only features are optional. Preserve existing fallbacks in `App.tsx`, `src/components/ui.tsx`, and native-module wrappers.

## Source of truth

- Read `docs/API_CONTRACT.md` before changing backend calls or domain behavior.
- Keep `src/api/types.ts`, `src/api/endpoints.ts`, and `docs/API_CONTRACT.md` aligned.
- Unwrap Laravel API Resources through `unwrap<T>()`; paginated objects are returned as-is.
- Map Laravel 422 validation errors to request fields with `ApiError.fieldErrors`. Use `useAction` for mutation loading and error handling.
- Keep mock behavior in `src/api/mock.ts` and `src/api/endpoints.ts` aligned with real API behavior.

## Architecture and conventions

- App entry and providers: `App.tsx`.
- Authentication and onboarding gating: `src/navigation/RootNavigator.tsx`.
- Routes and screen parameter types: `src/navigation/RootNavigator.tsx`, `src/navigation/MainTabs.tsx`, and `src/navigation/types.ts`.
- API primitives and endpoint wrappers: `src/api/client.ts`, `src/api/config.ts`, and `src/api/endpoints.ts`.
- Zustand stores: `src/store/auth.ts`, `src/store/onboarding.ts`, and `src/store/ride.ts`.
- Reusable hooks: `src/hooks/`.
- Shared UI and design tokens: `src/components/ui.tsx`, `src/components/ride.tsx`, and `src/theme/index.ts`.
- Server-event handling: `src/lib/events.ts`. Preserve both push and polling delivery through the same event names.
- Localization: add reusable copy to `src/lib/i18n.ts` rather than introducing a second localization mechanism.
- Domain utilities: place shared format/date/network/database/camera logic in `src/lib/` or `src/utils/`.

## Implementation rules

- Reuse the existing shared UI components and theme tokens instead of introducing inline style systems.
- Screen files belong in the matching `src/screens/<domain>/` directory.
- Add or update `RootStackParamList` and `TabParamList` when navigation routes or route params change.
- Keep API calls in `src/api/endpoints.ts`; do not duplicate raw `http` calls in screens.
- Use `@/` imports only consistently with the existing `tsconfig.json` path configuration; otherwise prefer existing relative-import style.
- Use strict TypeScript and avoid `any` unless an existing boundary requires it, such as multipart upload data or Expo native fallbacks.
- Keep React components focused and follow existing hook/store/query patterns.
- Use React Query for server reads and Zustand only for shared app state or state that multiple screens update directly.
- Preserve safe-area, keyboard, loading, empty, error, offline, and back-navigation behavior.
- Move repeated user-facing copy into `src/lib/i18n.ts` when touching a screen for localization.

## Critical domain safeguards

- Never apply a driver lock while a ride is active. The lock must wait until the ride ends, as enforced in `RootNavigator` and `handleDriverEvent()`.
- On app restart, resume an active ride through `GET /rides/active`.
- Ride offers and booking popups are de-duplicated by event ID and their countdown/modal behavior must remain consistent.
- A 409 booking accept is "Booking just got taken"; a 422 schedule conflict must be presented as a schedule conflict.
- Never expose or request a rider's real phone number. Use the bridged `masked_phone` value from the API.
- Location, cash collection, and rating actions may be offline. Queue only supported operations and keep replayed endpoints idempotent.
- Do not change offline queue ordering or batch size without considering `src/lib/db.ts` and `src/lib/network.ts`.
- Keep billing, commission, fare, OTP, and appointment-time calculations server-authoritative; do not invent client-side money or schedule rules.
- Preserve auth and secure-token behavior in `src/api/client.ts` and `src/store/auth.ts`.

## Data and API changes

- When an API contract changes, update the route wrapper, type definitions, mock implementation, and `docs/API_CONTRACT.md` together.
- Preserve API response unwrapping and 401 unauthorized handling.
- Use integer rupees unless the contract explicitly defines paise or another unit.
- Use ISO 8601 values for request payload dates and times unless the contract specifies another format.
- Multipart fields and files belong in the existing `upload<T>()` helper shape.
- Do not log or persist tokens, OTPs, Aadhaar/PAN/bank details, or rider personal data.

## Validation

- Run `npm run typecheck` after TypeScript or navigation/API changes.
- Use `npx expo start` for app-level or Expo/React Native verification.
- Use `npx expo run:android` or `npx expo run:ios` only when a native-module or platform-specific behavior must be verified.
- Do not run `expo@latest`; the project pins its dependency versions and README must remain aligned with `package.json`.
- There is no automated test script currently configured. If you add or update tests, run the smallest existing focused test command and report whether test coverage is unavailable.

## Change discipline

- Make surgical changes; do not refactor unrelated screens or dependencies.
- Inspect nearby existing implementation before adding a helper or new pattern.
- Preserve existing behavior unless the request explicitly changes it.
- Update directly relevant README/API documentation when commands or contracts change.
- Before finishing, check route names, API payload names, mock parity, loading/error states, offline behavior, and TypeScript results.
