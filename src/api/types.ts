// Domain types shared with the Laravel backend.
// Keep in sync with docs/API_CONTRACT.md (Ravi's API resources).

export type VehicleType = 'hatchback' | 'sedan' | 'suv' | 'muv' | 'auto' | 'toto' | 'bike' | 'other';

export type ServiceCategory =
  | 'city'
  | 'local_8_80'
  | 'outstation_oneway'
  | 'outstation_round'
  | 'airport'
  | 'wedding_event'
  | 'corporate'
  | 'parcel';

export type RideType = 'city' | 'outstation_oneway' | 'outstation_round' | 'rental' | 'airport' | 'parcel';

export type PaymentMode = 'cash' | 'online';

export type DocumentKey =
  | 'aadhaar'
  | 'dl'
  | 'commercial_dl'
  | 'police_verification'
  | 'photo'
  | 'rc'
  | 'insurance'
  | 'fitness'
  | 'permit'
  | 'puc'
  | 'fastag'
  | 'tax_receipt'
  | 'vehicle_photos';

export type DocStatus = 'missing' | 'uploaded' | 'in_review' | 'approved' | 'rejected';

export type OnboardingStatus =
  | 'new' // no application yet
  | 'draft' // steps partly filled
  | 'submitted' // in review
  | 'approved' // approved, deposit not paid
  | 'active' // deposit paid, can drive
  | 'rejected';

export type LockReason = 'wallet' | 'insurance' | 'puc' | 'dl' | 'fitness' | 'permit';

export interface AppLock {
  reason: LockReason;
  amount_due?: number; // wallet lock
  starting_balance?: number;
  used_commission?: number;
  reminders_sent?: number;
  expired_on?: string; // document lock (ISO date)
  vehicle_number?: string;
}

export interface Driver {
  id: number;
  name: string;
  mobile: string;
  photo_url?: string | null;
  initials: string;
  rating: number;
  division: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  vehicle_year?: number;
  owner_name?: string;
  language: 'en' | 'hi';
  onboarding_status: OnboardingStatus;
  application_no?: string;
  lock: AppLock | null;
  ride_types: Record<RideType, boolean>;
  popup_settings: PopupSettings;
}

export interface PopupSettings {
  show_popups: boolean;
  show_during_ride: boolean;
  sound: boolean;
}

export interface HomeSummary {
  wallet_balance: number;
  today_earnings: number;
  rides_today: number;
  acceptance_rate: number; // 0-100
  rating: number;
  is_online: boolean;
  online_seconds: number;
  min_online_seconds: number; // e.g. 8h
  demand_hint?: string | null;
  new_bookings_count: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  name: string;
  lat?: number;
  lng?: number;
}

export interface RideOffer {
  id: number;
  type: RideType;
  payment: PaymentMode;
  fare: number;
  commission_pct: number;
  commission: number;
  net: number;
  pickup: Place;
  drop: Place | null; // null for rental "multiple stops"
  distance_km?: number;
  duration_min?: number;
  pickup_eta_min?: number;
  pickup_distance_km?: number;
  expires_in_sec: number; // e.g. 14 for city, 45 for bookings
  // type specific
  days?: number;
  allowance_per_day?: number;
  return_by?: string;
  package_label?: string; // "8 hr / 80 km"
  extra_km_rate?: number;
  extra_hour_rate?: number;
  starts_at?: string; // ISO, scheduled bookings
  terminal?: string;
  flight?: string;
  parking?: number;
  toll_note?: string;
  parcel?: { item: string; size: string; weight_kg: number; pickup_otp: boolean; delivery_otp: boolean };
  note?: string;
}

export interface Rider {
  name: string;
  initials: string;
  rating: number;
  masked_phone?: string;
}

export type RideStatus =
  | 'accepted'
  | 'arrived'
  | 'started'
  | 'awaiting_extras'
  | 'bill_submitted'
  | 'completed'
  | 'cancelled'
  | 'missed';

export interface ActiveRide extends RideOffer {
  status: RideStatus;
  rider: Rider;
  time_left_min?: number;
  distance_left_km?: number;
  next_instruction?: { distance_km: number; text: string };
  // rental live counters
  time_used_min?: number;
  km_used?: number;
  package_hours?: number;
  package_km?: number;
}

export interface TripCompleteSummary {
  ride_id: number;
  collect_amount: number;
  fare: number;
  commission: number;
  commission_pct: number;
  wallet_after: number;
  nearby_rides: { count: number; sample?: { label: string; fare: number } };
}

export type BookingFit = 'ok' | 'tight' | 'conflict';

export interface Booking {
  id: number;
  type: RideType;
  title: string; // "Saharsa to Patna"
  pickup: Place;
  drop: Place | null;
  starts_at: string;
  fare: number;
  net: number;
  distance_km?: number;
  meta: string; // "Today, 10:00 AM · 210 km"
  posted_ago: string; // "2 min ago"
  is_new: boolean;
  fit: BookingFit;
  spare_min?: number;
  late_by_min?: number;
  schedule?: {
    current_ride_ends: string;
    earliest_at_pickup: string;
    report_time: string;
  };
  block_city_after?: string;
}

export interface Lead {
  id: number;
  kind: 'going_empty' | 'need_vehicle';
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  vehicle_type: VehicleType;
  fare?: number | null;
  note?: string | null;
  posted_ago: string;
  driver_name: string;
  driver_rating: number;
  is_mine: boolean;
}

export interface WalletTxn {
  id: number;
  title: string;
  subtitle: string;
  amount: number; // negative for debit
  balance_after: number;
  created_at: string;
}

export interface Wallet {
  balance: number;
  starting_balance: number;
  commission_pct: number;
  min_balance: number; // kept to cover commission
  withdrawable: number;
  low_balance_hours?: number | null; // hours since low, drives the 6h/12h rule
  transactions: WalletTxn[];
  bank?: { bank_name: string; last4: string } | null;
  upi_id?: string | null;
}

export interface Earnings {
  period: 'today' | 'week' | 'month';
  net: number;
  bars: { label: string; value: number }[];
  trips: number;
  online_time: string;
  gross: number;
  commission: number;
  breakdown: string; // "5 / 1 / 1"
}

export interface TripRecord {
  id: number;
  code: string; // "#A1042"
  title: string;
  type: RideType;
  subtitle: string;
  amount: number;
  status: 'completed' | 'cancelled' | 'missed';
}

export interface DriverDocument {
  key: DocumentKey;
  label: string;
  group: 'driver' | 'vehicle';
  status: DocStatus;
  valid_till?: string | null;
  expiry_state?: 'valid' | 'expiring' | 'expired' | null;
  needs_admin_approval?: boolean;
}

export interface Penalty {
  month_total: number;
  cancel_rate: number;
  rules: { label: string; amount: string }[];
  recent: { id: number; title: string; when: string; amount: number }[];
}

export interface Plan {
  rows: { category: string; aolo_pct: number; driver_pct: number }[];
  deposit_amount: number;
  refund_condition: string;
}

export interface FareBill {
  ride_id: number;
  title: string;
  lines: { label: string; amount: number | null; note?: string }[];
  total: number;
  commission_note: string;
  steps: { label: string; state: 'done' | 'waiting' | 'pending' }[];
  /** True once the rider approved extras and AOLO finalised night charge. */
  can_collect: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta?: { total: number; current_page: number; last_page: number };
}
