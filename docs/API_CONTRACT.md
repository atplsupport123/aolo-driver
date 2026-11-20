# AOLO Driver App — API contract (for the Laravel backend)

This is everything the React Native driver app calls. Field names and shapes
match `src/api/types.ts`; if the backend needs to differ, change both together.

Base URL: `https://api.aolocabs.com/api/v1` (set in `app.json → expo.extra.apiBaseUrl`)

## Conventions

| Topic | What the app expects |
|---|---|
| Auth | Laravel **Sanctum** personal access token. App sends `Authorization: Bearer <token>`. |
| Content | `Accept: application/json`. JSON bodies, except uploads (`multipart/form-data`). |
| Language | `Accept-Language: en` or `hi`. Use it for SMS, push and message text. |
| Wrapping | API Resources are fine: single objects as `{ "data": {...} }`; lists either a bare array or `{ data, meta, links }`. The app unwraps `data`. |
| Validation | Standard Laravel 422: `{ "message": "...", "errors": { "field": ["msg"] } }`. Field names must match request keys so errors show under the right input. |
| Unauthenticated | 401 → app clears the token and returns to the login screen. |
| Business errors | Use `{ "message": "...", "code": "..." }`. Codes the app reacts to are listed per endpoint. |
| Money | Integers in rupees (no paise) unless noted. |
| Dates | ISO 8601 with timezone (`2026-11-18T10:00:00+05:30`). Display strings like `"Today, 10:00 AM"` are pre-formatted by the backend where the type says `meta` / `posted_ago`. |

---

## 1. Auth

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/otp/send` | `{ mobile: "9876543210", intent: "register" \| "login" }` | `{ resend_in: 30 }` |
| POST | `/auth/otp/verify` | `{ mobile, otp: "482716", device_name }` | `{ token, driver: Driver }` |
| POST | `/auth/logout` | — | 204 |

- OTP is 6 digits. Rate-limit sends (e.g. 3 per 10 min per number).
- `intent=login` for a number with no account → 422 `errors.mobile`.
- `driver.onboarding_status` decides where the app goes next:
  `new | draft | rejected` → onboarding form, `submitted` → "Application submitted",
  `approved` → plan + deposit, `active` → home.

## 2. Driver profile

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/driver/me` | — | `Driver` |
| PATCH | `/driver/me` | `{ name?, division? }` | `Driver` |
| POST | `/driver/me/photo` | multipart `photo` | `Driver` |
| POST | `/driver/me/mobile/otp` | `{ mobile }` | `{ resend_in }` |
| POST | `/driver/me/mobile/verify` | `{ mobile, otp }` | `Driver` |
| POST | `/driver/me/vehicle-change-requests` | `{ vehicle_number }` | 201 (needs admin approval) |
| PUT | `/driver/ride-types` | `{ ride_types: { city: true, outstation_oneway: true, outstation_round: true, rental: true, airport: true, parcel: false } }` | same object |
| PUT | `/driver/popup-settings` | `{ show_popups, show_during_ride, sound }` | same object |
| PUT | `/driver/language` | `{ language: "en" \| "hi" }` | 204 |
| DELETE | `/driver/me` | `{ confirm: "DELETE" }` | 204. 422 if active ride or dues pending. |

**Driver**
```json
{
  "id": 101, "name": "Ramesh Kumar", "mobile": "+91 98765 43210", "photo_url": null,
  "initials": "RK", "rating": 4.8, "division": "Saharsa division",
  "vehicle_number": "BR 19 XX 1234", "vehicle_type": "sedan", "vehicle_year": 2020, "owner_name": "Ramesh Kumar",
  "language": "en", "onboarding_status": "active", "application_no": "AOLO/VAF/2026/00417",
  "lock": null,
  "ride_types": { "city": true, "outstation_oneway": true, "outstation_round": true, "rental": true, "airport": true, "parcel": false },
  "popup_settings": { "show_popups": true, "show_during_ride": true, "sound": true }
}
```

**lock** — when not null the app shows the full-screen APP LOCKED page and only allows recharge / upload / support.
```json
{ "reason": "wallet", "amount_due": 450, "starting_balance": 2500, "used_commission": 450, "reminders_sent": 2 }
{ "reason": "insurance", "expired_on": "17 Nov 2026", "vehicle_number": "BR 19 XX 1234" }
```
`reason`: `wallet | insurance | puc | dl | fitness | permit`.
The backend sets the lock (scheduled job: wallet low for 12h; document past `valid_till`).
**Never lock during an active ride** — set it, but let the ride finish (the app also guards this).

## 3. Onboarding (6 steps)

| Method | Path | Body |
|---|---|---|
| PUT | `/onboarding/owner` | `{ branch_city, full_name, mobile_1, mobile_2?, aadhaar, pan, gst?, upi_id?, bank_account, ifsc }` |
| PUT | `/onboarding/driver` | `{ is_owner_driver, name?, mobile?, aadhaar?, badge_no?, experience_years?, address? }` (others required when `is_owner_driver=false`) |
| PUT | `/onboarding/vehicle` | `{ vehicle_type, vehicle_number, year, colour, owner_name?, fitness_valid_upto: "DD/MM/YYYY", puc_valid_upto, fastag_no?, has_gps, has_dashcam }` |
| PUT | `/onboarding/categories` | `{ categories: ["city","local_8_80","outstation_oneway","outstation_round","airport","wedding_event","corporate","parcel"] }` |
| POST | `/onboarding/documents/{key}` | multipart `files[]` (image or PDF). `vehicle_photos` needs 4. |
| POST | `/onboarding/submit` | `{ terms_accepted: true }` → `{ application_no }` |
| GET | `/onboarding/status` | `{ status, application_no, steps: [{ label, state: "done"\|"in_review"\|"pending" }] }` |
| GET | `/onboarding/plan` | `{ rows: [{ category, aolo_pct, driver_pct }], deposit_amount, refund_condition }` |
| POST | `/onboarding/deposit` | `PaymentResult` (see Payments). On success set status `active`. |

Document keys: `aadhaar, dl, commercial_dl, police_verification, photo, rc, insurance, fitness, permit, puc, fastag, tax_receipt, vehicle_photos`.

Suggested server rules: Aadhaar 12 digits, PAN `^[A-Z]{5}\d{4}[A-Z]$`, IFSC `^[A-Z]{4}0[A-Z0-9]{6}$`, mobile `^[6-9]\d{9}$`. Store Aadhaar / bank numbers encrypted (Laravel `encrypted` cast).

## 4. Home and duty

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/driver/home` | — | `HomeSummary` |
| POST | `/driver/duty/online` | `{ lat, lng }` | `HomeSummary`. 423 `code=app_locked` if locked. |
| POST | `/driver/duty/offline` | `{ reason?: "emergency"\|"vehicle"\|"health"\|"other", note? }` | `{ penalty }` (applied if under 8h minimum and reason not verified) |
| POST | `/driver/location` | `{ lat, lng, heading, speed }` | 204. Sent every ~10s while online, also from the background task. |

```json
{ "wallet_balance": 2050, "today_earnings": 1240, "rides_today": 7, "acceptance_rate": 92, "rating": 4.8,
  "is_online": true, "online_seconds": 8100, "min_online_seconds": 28800,
  "demand_hint": "High demand near Saharsa Chowk. Go online to get requests.", "new_bookings_count": 6 }
```

## 5. Instant rides (city, parcel, and live outstation / rental / airport)

Offers reach the app by socket (`ride.offered`, see §11). Then:

| Method | Path | Body | Returns / errors |
|---|---|---|---|
| GET | `/rides/offers/{id}` | — | `RideOffer` |
| POST | `/rides/offers/{id}/accept` | — | `ActiveRide`. 409 `code=booking_taken` if someone else got it, 410 if expired. |
| POST | `/rides/offers/{id}/decline` | — | 204 (affects acceptance rate) |
| GET | `/rides/active` | — | `ActiveRide` or `null` (used to resume after app restart) |
| POST | `/rides/{id}/arrived` | — | 204 |
| POST | `/rides/{id}/start` | `{ otp: "4827" }` | `ActiveRide` (status `started`). 422 `errors.otp` if wrong. |
| POST | `/rides/{id}/complete` | — | `TripCompleteSummary` (city / parcel / rental-without-extras) |
| POST | `/rides/{id}/cash-collected` | — | 204. Deduct commission from wallet for cash rides here. |
| POST | `/rides/{id}/rate` | `{ rating: 1-5 }` | 204 |
| POST | `/rides/{id}/cancel` | `{ reason }` | 204 (penalty rules apply) |
| POST | `/rides/{id}/emergency` | `{ reason: "medical"\|"accident"\|"safety"\|"other", lat, lng }` | `{ ticket_id }`. Alert support, reassign rider, no penalty if verified. |
| POST | `/rides/{id}/stops` | `{ place }` | 204 (rental) |
| POST | `/rides/{id}/extras` | multipart, see below | `FareBill` |
| GET | `/rides/{id}/bill` | — | `FareBill` (polled every 15s; also push `bill.updated`) |

**RideOffer** — common fields plus per-type extras:
```json
{
  "id": 5001, "type": "city", "payment": "cash", "fare": 420, "commission_pct": 15, "commission": 63, "net": 357,
  "pickup": { "name": "Mathahi Chowk, Saharsa", "lat": 25.88, "lng": 86.60 },
  "drop":   { "name": "Saharsa Railway Station", "lat": 25.875, "lng": 86.59 },
  "distance_km": 3.2, "duration_min": 11, "pickup_eta_min": 6, "pickup_distance_km": 3.2,
  "expires_in_sec": 14, "note": null
}
```
`type`: `city | outstation_oneway | outstation_round | rental | airport | parcel`.
Extras by type:
- outstation_round: `days, allowance_per_day, return_by`
- rental: `package_label ("8 hr / 80 km"), extra_km_rate, extra_hour_rate, starts_at`; `drop` may be `null` ("Multiple stops")
- airport: `terminal, flight, parking, toll_note`
- parcel: `parcel: { item, size, weight_kg, pickup_otp, delivery_otp }`
- `note` is the one-line subtitle under the fare (e.g. "210 km · you return empty, so full fare shown").

**ActiveRide** = `RideOffer` + `status`, `rider: { name, initials, rating, masked_phone }`,
`time_left_min, distance_left_km, next_instruction: { distance_km, text }`,
and for rental `time_used_min, km_used, package_hours, package_km`.
`masked_phone` must be a bridged number (e.g. Exotel/Knowlarity), never the rider's real number.

**TripCompleteSummary**
```json
{ "ride_id": 5001, "collect_amount": 420, "fare": 420, "commission": 63, "commission_pct": 15, "wallet_after": 1987,
  "nearby_rides": { "count": 2, "sample": { "label": "Station Road · Return trip to Madhepura", "fare": 900 } } }
```

**Extras** (`POST /rides/{id}/extras`, multipart). All optional numbers:
`start_odo, end_odo, start_time, end_time (minutes since midnight), toll, extra_toll, parking, waiting_min, allowance, extra_km`,
files `odometer_photos[]`, `receipts[]`. Server computes the bill (rates: ₹14/km, ₹150/hr, waiting ₹2/min after 30 min — 45 min for airport). Night charge (12:00–3:30 AM) is added by AOLO, not the driver.

**FareBill**
```json
{ "ride_id": 5003, "title": "Outstation round trip · 120 km",
  "lines": [ { "label": "Package fare", "amount": 5200 }, { "label": "Extra 20 km", "amount": 280 },
             { "label": "Night charge (12 AM to 3:30 AM)", "amount": null, "note": "AOLO will add" } ],
  "total": 6800, "commission_note": "AOLO commission 15% on fare and extra km: ₹822",
  "steps": [ { "label": "You submitted the bill", "state": "done" }, { "label": "Rider approves the extras", "state": "waiting" },
             { "label": "AOLO adds night charge", "state": "pending" }, { "label": "Collect the final amount", "state": "pending" } ],
  "can_collect": false }
```

## 6. Scheduled bookings (outstation / rental / airport)

| Method | Path | Query / body | Returns |
|---|---|---|---|
| GET | `/bookings` | `tab=live\|open\|upcoming`, `type=all\|<RideType>` | `Booking[]` |
| GET | `/bookings/{id}` | — | `Booking` |
| POST | `/bookings/{id}/accept` | — | `Booking`. **409** `code=booking_taken` (first to accept wins). **422** `code=schedule_conflict`. |
| POST | `/bookings/{id}/notify-when-free` | — | 204 |

The **schedule check** is computed server-side per driver: current ride's expected end → travel time to pickup → report time (30 min before start).
```json
{ "id": 7001, "type": "outstation_oneway", "title": "Saharsa to Patna",
  "pickup": { "name": "Mathahi Chowk, Saharsa" }, "drop": { "name": "Gandhi Maidan, Patna" },
  "starts_at": "2026-11-18T10:00:00+05:30", "fare": 2800, "net": 2380, "distance_km": 210,
  "meta": "Today, 10:00 AM · 210 km", "posted_ago": "2 min ago", "is_new": true,
  "fit": "ok", "spare_min": 50, "late_by_min": null,
  "schedule": { "current_ride_ends": "8:00 AM", "earliest_at_pickup": "8:40 AM", "report_time": "9:30 AM" },
  "block_city_after": "8:50 AM" }
```
`fit`: `ok | tight (< ~15 min spare) | conflict`. After accept, stop offering city rides that would end after `block_city_after`.

## 7. Leads (driver-to-driver)

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/leads` | `scope=all\|mine`, `kind=all\|going_empty\|need_vehicle` | `Lead[]` |
| POST | `/leads` | `{ kind, from_city, to_city, date, time, vehicle_type, fare?, note?, contact_in_app }` | `Lead` |
| POST | `/leads/{id}/contact` | — | `{ thread_id }` (in-app chat; numbers stay hidden) |
| DELETE | `/leads/{id}` | — | 204 (own leads only) |

## 8. Wallet, payments, earnings, trips

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/wallet` | — | `Wallet` |
| POST | `/wallet/recharge` | `{ amount, method: "upi"\|"card"\|"netbanking" }` | `PaymentResult`. On success clear a wallet lock. |
| POST | `/wallet/withdraw` | `{ amount, destination: "bank"\|"upi" }` | `{ reference }`. Max = `withdrawable` (balance − min_balance). Min ₹100. |
| GET | `/payments/{order_id}` | — | `{ paid }` |
| GET | `/earnings` | `period=today\|week\|month` | `Earnings` |
| GET | `/trips` | `type, status=all\|completed\|cancelled_missed, range=today\|week\|month\|all` | `TripRecord[]` |
| GET | `/trips/report` | same as `/trips` | `{ url }` — signed temporary URL to a PDF |
| GET | `/penalties` | — | `Penalty` |

**PaymentResult** `{ paid: boolean, order_id?: string, checkout_url?: string }`.
If `paid=false` with a `checkout_url` (UPI intent or hosted Razorpay/PhonePe page), the app opens it and polls `/payments/{order_id}`. If Ravi prefers the Razorpay RN SDK instead, return `order_id` + `key` and we will swap the flow.

**Wallet rule** (from the SLA): starting balance credited by admin; reminder at 6h of low balance, lock at 12h. Expose `low_balance_hours` so the banner can count down.

## 9. Documents

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/documents` | — | `DriverDocument[]` |
| POST | `/documents/{key}` | multipart `files[]`, `valid_till?` | `DriverDocument` (status `in_review`) |
| POST | `/insurance-requests` | `{ pay_with: "wallet"\|"self" }` | `{ request_id }` — AOLO calls the driver before charging |

```json
{ "key": "insurance", "label": "Insurance certificate", "group": "vehicle", "status": "approved",
  "valid_till": "2026-11-19T23:59:00+05:30", "expiry_state": "expiring", "needs_admin_approval": true }
```
`status`: `missing | uploaded | in_review | approved | rejected`. `expiry_state`: `valid | expiring (≤ 24h) | expired`.

## 10. Legal and support

| Method | Path | Body |
|---|---|---|
| POST | `/legal/sla/accept` | — |
| POST | `/legal/privacy/acknowledge` | — |
| POST | `/support/messages` | `{ message, topic? }` → `{ ticket_id }` |
| POST | `/support/sos` | `{ lat, lng, ride_id? }` → `{ ticket_id }` — page the on-call team immediately |

Terms, SLA, privacy and penalty-structure text is currently bundled in the app. Optional later: `GET /legal/{terms|sla|privacy|penalty-structure}` so AOLO can edit without a release.

## 11. Server events (push notifications + polling feed)

The approved library list has no WebSocket client, so events reach the app two ways. **Both use the same event names and payloads**, and every event has a unique `id` so the app can ignore duplicates.

**a) Push notifications (FCM / APNs)** — for when the app is in the background or closed.

| Method | Path | Body |
|---|---|---|
| POST | `/driver/push-tokens` | `{ token, provider: "android" \| "ios", platform: "android" \| "ios" }` — the native FCM/APNs device token. Upsert per driver + device. |

Send a **data** message with: `{ "id": "evt_123", "event": "ride.offered", "payload": "<JSON>" }` plus a visible title/body (e.g. "New city ride · ₹420"). Android channel id: `rides` (high priority). For Laravel, `laravel-notification-channels/fcm` works. The app needs `google-services.json` (Android) and an APNs key (iOS) — Ravi/AOLO to provide.

**b) Polling feed** — guarantees delivery while the app is open.

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/driver/events` | `after=<last event id>` (empty on first call) | `[{ id, event, payload }]` oldest first, max ~20 |

The app calls this every 5 seconds while the driver is online and the app is in the foreground. Keep events ~10 minutes; ride offers expire anyway.

| Event | Payload | App behaviour |
|---|---|---|
| `ride.offered` | `{ offer: RideOffer }` | Full-screen request with countdown. Ignored if already on a ride. |
| `booking.posted` | `{ booking: Booking }` | Popup for 45s (respects popup settings; during a ride only if `fit != conflict`). |
| `booking.taken` | `{ booking_id }` | Informational; accept returns 409 anyway. |
| `ride.cancelled` | `{ ride_id, reason }` | Clears the trip and returns home. |
| `bill.updated` | `{ ride_id }` | Fare bill refreshes. |
| `wallet.updated` | `{}` | Refresh driver/home. |
| `app.locked` | `{ lock: AppLock }` | Lock screen (deferred until the current ride ends). |
| `app.unlocked` | `{}` | Back to home. |
| `document.expiring` | `{ key, label, ends_at }` | "Action needed in 24 hours" sheet. |

If AOLO later approves a WebSocket client (e.g. `laravel-echo` + `pusher-js` for Laravel Reverb), it plugs into the same `handleDriverEvent()` in `src/lib/events.ts`.

## 11b. Offline sync

When there is no internet the app stores data in SQLite and sends it when the connection returns:

| Method | Path | Body |
|---|---|---|
| POST | `/driver/location/batch` | `{ points: [{ lat, lng, heading, speed, recorded_at }] }` (max 200 per call, oldest first) |

`/rides/{id}/cash-collected` and `/rides/{id}/rate` may also arrive late, replayed from the queue — make them **idempotent** (calling twice must not deduct commission twice).

## 12. Open items for AOLO / Ravi

Placeholders in the PDF that the app shows as-is until provided:
`[AMOUNT]` penalties and deposit, `[REFUND CONDITION]`, `[HOURS]` support hours, `[WHATSAPP NUMBER]`, `[DATE]` privacy date, and the 17 `[Offence name]` rows in the penalty structure.
