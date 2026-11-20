# AOLO Driver — React Native app

Driver app for AOLO Cabs, built from `AOLO_Driver_App_UI_1.pdf` (66 screens).
Expo (SDK 58) + TypeScript, using the library list approved by the senior.
Backend: Laravel (Ravi) — see **[docs/API_CONTRACT.md](docs/API_CONTRACT.md)**.

## Libraries (approved list)

| Category | Package | Where it is used |
|---|---|---|
| Framework | `expo` (SDK 58) + `react-native` | whole app |
| Language | `typescript` | whole app |
| Navigation | `@react-navigation/native`, `native-stack`, `bottom-tabs` | `src/navigation` (side menu is a modal screen, no drawer package) |
| State | `zustand` | `src/store`, network + language state |
| API | `@tanstack/react-query` + `axios` | `src/api`, every screen |
| Forms | `react-hook-form` + `zod` | login, onboarding steps 1–3, create lead (`src/lib/schemas.ts`) |
| Secure storage | `expo-secure-store` | login token |
| Fast storage | `react-native-mmkv` | language, push token (`src/lib/storage.ts`) |
| Offline DB | `expo-sqlite` | offline queue for location and actions (`src/lib/db.ts`) |
| Network | `@react-native-community/netinfo` | offline banner, replays the queue (`src/lib/network.ts`) |
| Maps | `react-native-maps` | `src/components/MapPanel.tsx` |
| Location | `expo-location` + `expo-task-manager` | background location while online (`src/tasks`) |
| Notifications | `expo-notifications` | ride requests, bookings, locks by push (`src/lib/push.ts`) |
| Camera | `expo-camera` | in-app camera for documents, odometer (`screens/common/CameraScreen.tsx`) |
| Image selection | `expo-image-picker` | choose from gallery |
| Files | `expo-file-system` | photo size check before upload |
| Animation / gestures | `react-native-reanimated`, `react-native-gesture-handler` | menu slide-in + swipe to close, offline banner |
| Icons / SVG | `lucide-react-native`, `react-native-svg` | tabs, home tiles, menu, headers, support |
| Safe areas | `react-native-safe-area-context` | every screen |
| Keyboard | `react-native-keyboard-controller` | form screens (`Screen` in `ui.tsx`) |
| Date/time | `dayjs` | `src/lib/date.ts` |
| Lists | `@shopify/flash-list` | bookings, leads, trips, history |

**Required peers (not new choices):** `react-native-worklets` (needed by Reanimated 4) and `react-native-screens` (needed by React Navigation).

**Not on the list, so built without a package:** live socket (uses push + polling instead, see API contract §11), Hindi/English (`src/lib/i18n.ts`), PDF upload (photos only), vibration (React Native's built-in `Vibration`).

## Run it

The project is pinned to **Expo SDK 58**. Use an Expo Go version compatible with SDK 58, or a development build. **Do not run `expo@latest`.**

```bash
npm install
npx expo install --fix      # aligns package versions with SDK 58
npx expo start              # scan the QR with Expo Go (Android) or the Camera app (iPhone)
```

Settings are in `.env` (`EXPO_PUBLIC_USE_MOCK`, `EXPO_PUBLIC_API_URL`). Restart `npx expo start` after changing it.

### Expo Go vs development build

Expo Go is fine for checking screens. Some approved libraries are native modules that Expo Go may not include; the app falls back automatically so it still runs:

| Feature | In Expo Go | In a development build |
|---|---|---|
| MMKV storage | falls back to memory | real MMKV |
| Keyboard controller | falls back to React Native's keyboard handling | real |
| Push notifications | not available (polling still works) | real (needs Firebase config) |
| Background location | foreground only | real, with an "AOLO Driver is online" notification |

For the full app: `npx expo run:android` (needs Android Studio) or an EAS development build.

### Sample-data mode

- Any 10-digit mobile → any 6-digit OTP. Sample mode does not send SMS; this is expected while `EXPO_PUBLIC_USE_MOCK=true`.
  - **Create new account** → 6 onboarding steps → submitted → pull down to refresh → approved → pay deposit → home.
  - **I am an existing driver** → straight to home.
- Tap **GO** → a city ride request in ~6 seconds → Accept → any 4-digit OTP → trip → booking popup mid-ride → End trip.
- **Menu → Developer tools (mock)** fires every other event: each ride type, booking popup, booking taken, document expiring, each APP LOCKED state.

## Structure

```
src/
  api/          client.ts (axios + token + 422 mapping), endpoints.ts (every call), types.ts, mock.ts
  lib/          events.ts (one handler for server events), push.ts, network.ts, db.ts, storage.ts,
                schemas.ts (zod), i18n.ts, date.ts (dayjs), camera.ts
  tasks/        backgroundLocation.ts (expo-task-manager)
  store/        zustand: auth, ride, onboarding
  navigation/   RootNavigator (auth → onboarding → locked → main), MainTabs, navRef
  components/   ui.tsx (design system + FormInput), MapPanel, OfflineBanner, ride pieces, BookingCard
  hooks/        useAction, useCountdown, useLocationPing, useEventFeed, pickFile
  screens/      auth, onboarding, home, ride, booking, leads, documents, wallet, trips, profile,
                support, legal, common
```

## Screen map (PDF page → file)

| PDF | Screen | File |
|---|---|---|
| 9 | Drive with AOLO | `screens/auth/WelcomeScreen.tsx` |
| 1 | Verify OTP | `screens/auth/OtpScreen.tsx` |
| 2–6, 65 | Onboarding steps 1–6 | `screens/onboarding/*` |
| 7 | Application submitted | `screens/onboarding/ApplicationSubmittedScreen.tsx` |
| 8 | Approved / plan / deposit | `screens/onboarding/PlanScreen.tsx` |
| 10, 11 | Home offline / online | `screens/home/HomeScreen.tsx` |
| 12 | Side menu | `screens/home/MenuScreen.tsx` |
| 13 | Ride types | `screens/profile/RideTypesScreen.tsx` |
| 14 | Go offline early | `screens/home/GoOfflineSheet.tsx` |
| 15 | Edit profile | `screens/profile/EditProfileScreen.tsx` |
| 16 | Outstation bookings | `screens/booking/OutstationBookingsScreen.tsx` |
| 17, 18 | Create / posted leads | `screens/leads/*` |
| 19 | Support | `screens/support/SupportScreen.tsx` |
| 20–25 | Ride requests (all 6 types) | `screens/ride/RideRequestScreen.tsx` |
| 26 | Bookings | `screens/booking/BookingsScreen.tsx` |
| 27, 28 | Booking can / cannot take | `screens/booking/BookingDetailScreen.tsx` |
| 29, 31 | Booking popup (during ride / free) | `screens/booking/BookingPopupScreen.tsx` |
| 30 | Booking added | `screens/booking/BookingAddedScreen.tsx` |
| 32 | Rental mode | `screens/ride/RentalModeScreen.tsx` |
| 33 | Booking taken | `screens/booking/BookingTakenScreen.tsx` |
| 34 | Booking popup settings | `screens/booking/BookingPopupSettingsScreen.tsx` |
| 35 | Pickup OTP | `screens/ride/PickupOtpScreen.tsx` |
| 36, 42 | Trip in progress (+ doc-expired banner) | `screens/ride/TripInProgressScreen.tsx` |
| 37 | Trip complete | `screens/ride/TripCompleteScreen.tsx` |
| 38 | Cannot continue (emergency) | `screens/ride/EmergencyHandoverScreen.tsx` |
| 39, 43, 46–49 | APP LOCKED (wallet, insurance, PUC, DL, fitness, permit) | `screens/documents/LockedScreen.tsx` |
| 40 | Documents | `screens/documents/DocumentsScreen.tsx` |
| 41 | Action needed in 24h | `screens/documents/DocumentExpiringScreen.tsx` |
| 44, 45 | Insurance Now / request sent | `screens/documents/Insurance*.tsx` |
| 50–52 | End trip extras (outstation, rental, airport) | `screens/ride/EndTripExtrasScreen.tsx` |
| 53 | Fare bill | `screens/ride/FareBillScreen.tsx` |
| 54 | Earnings | `screens/trips/EarningsScreen.tsx` |
| 55 | My trips | `screens/trips/TripsScreen.tsx` |
| 56 | Ride history + PDF report | `screens/trips/RideHistoryScreen.tsx` |
| 57–59 | Wallet, recharge, withdraw | `screens/wallet/*` |
| 60 | Penalty | `screens/wallet/PenaltyScreen.tsx` |
| 61, 62, 66 | SLA, privacy, penalty structure | `screens/legal/*` |
| 63 | Contact us | `screens/support/ContactUsScreen.tsx` |
| 64 | Delete account | `screens/profile/DeleteAccountScreen.tsx` |
| — | In-app camera | `screens/common/CameraScreen.tsx` |

## Key behaviours

- **Gating** lives in `RootNavigator`: no token → login; onboarding status picks the onboarding / submitted / plan stack; `driver.lock` shows APP LOCKED — but never mid-ride (the lock waits until the ride ends, PDF p.42).
- **Ride offers and booking popups** arrive by push notification or the 5-second polling feed, both handled by `src/lib/events.ts`, and open as modals with countdowns (14s ride, 45s booking). A 409 on accept shows "Booking just got taken".
- **Offline**: NetInfo shows a red banner; location points and small actions (cash collected, rating) are saved to SQLite and sent when the internet returns.
- **Location**: sent every ~10s while online by a background task.
- **Resume**: on Home focus the app calls `GET /rides/active` and jumps back into the trip after a restart.

## Before release

- Placeholders from the PDF still to fill: `[AMOUNT]`, `[REFUND CONDITION]`, `[HOURS]`, `[WHATSAPP NUMBER]`, `[DATE]`, penalty offence names.
- Firebase config (`google-services.json`) and APNs key for push notifications; Google Maps Android key in `app.json`.
- Payments: `PaymentResult` supports a hosted checkout / UPI intent URL; swap in the Razorpay SDK if Ravi uses it (needs senior approval as a new package).
- Move remaining screen copy into `src/lib/i18n.ts` for full Hindi.
