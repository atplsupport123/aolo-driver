// Every backend call the app makes. Each function hits the Laravel API
// (see docs/API_CONTRACT.md) or, in mock mode, the in-memory mock.
import { http, unwrap, ApiError } from './client';
import { outbox } from '../lib/db';
import { isOnline } from '../lib/network';
import { config } from './config';
import * as M from './mock';
import type {
  ActiveRide,
  Booking,
  Driver,
  DriverDocument,
  DocumentKey,
  Earnings,
  FareBill,
  HomeSummary,
  Lead,
  Penalty,
  Plan,
  PopupSettings,
  RideOffer,
  RideType,
  ServiceCategory,
  TripCompleteSummary,
  TripRecord,
  VehicleType,
  Wallet,
  LockReason,
} from './types';

const mock = config.useMock;

async function get<T>(url: string, params?: object): Promise<T> {
  const res = await http.get(url, { params });
  return unwrap<T>(res.data);
}
async function post<T>(url: string, body?: object): Promise<T> {
  const res = await http.post(url, body);
  return unwrap<T>(res.data);
}
/** For small actions that can wait: if there is no internet, save to SQLite and send later. */
async function postOrQueue(url: string, body?: object) {
  if (!isOnline()) {
    outbox.add('POST', url, body);
    return;
  }
  try {
    await post(url, body);
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) outbox.add('POST', url, body);
    else throw e;
  }
}
async function put<T>(url: string, body?: object): Promise<T> {
  const res = await http.put(url, body);
  return unwrap<T>(res.data);
}
async function patch<T>(url: string, body?: object): Promise<T> {
  const res = await http.patch(url, body);
  return unwrap<T>(res.data);
}
async function del<T>(url: string, body?: object): Promise<T> {
  const res = await http.delete(url, { data: body });
  return unwrap<T>(res.data);
}

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

async function upload<T>(
  url: string,
  fields: Record<string, string | number | boolean | undefined>,
  files: Record<string, UploadFile | UploadFile[]>,
) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
  Object.entries(files).forEach(([k, f]) => {
    const list = Array.isArray(f) ? f : [f];
    list.forEach((file) => fd.append(Array.isArray(f) ? `${k}[]` : k, file as any));
  });
  const res = await http.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return unwrap<T>(res.data);
}

// ───────────────────────── Auth ─────────────────────────
export const authApi = {
  sendOtp: async (mobile: string, intent: 'register' | 'login') => {
    if (mock) {
      await M.delay();
      // Mock: "existing driver" lands on Home, "new account" starts onboarding.
      M.db.driver.onboarding_status = intent === 'login' ? 'active' : 'new';
      return { resend_in: 30 };
    }
    return post<{ resend_in: number }>('/auth/otp/send', { mobile, intent });
  },

  verifyOtp: async (mobile: string, otp: string) => {
    if (mock) {
      await M.delay();
      M.assertOtp(otp, M.db.otp);
      M.db.driver.mobile = `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
      return { token: 'mock-token', driver: M.db.driver };
    }
    return post<{ token: string; driver: Driver }>('/auth/otp/verify', { mobile, otp, device_name: 'driver-app' });
  },

  logout: async () => (mock ? M.delay(100) : post('/auth/logout')),
};

// ───────────────────────── Driver profile ─────────────────────────
export const driverApi = {
  me: async () => (mock ? (await M.delay(150), { ...M.db.driver }) : get<Driver>('/driver/me')),

  update: async (body: Partial<Pick<Driver, 'name' | 'division'>>) => {
    if (mock) {
      await M.delay();
      Object.assign(M.db.driver, body);
      return { ...M.db.driver };
    }
    return patch<Driver>('/driver/me', body);
  },

  uploadPhoto: async (file: UploadFile) =>
    mock
      ? (await M.delay(), { ...M.db.driver, photo_url: file.uri })
      : upload<Driver>('/driver/me/photo', {}, { photo: file }),

  requestMobileChange: async (mobile: string) =>
    mock ? (await M.delay(), { resend_in: 30 }) : post<{ resend_in: number }>('/driver/me/mobile/otp', { mobile }),

  confirmMobileChange: async (mobile: string, otp: string) =>
    mock ? (await M.delay(), { ...M.db.driver, mobile }) : post<Driver>('/driver/me/mobile/verify', { mobile, otp }),

  requestVehicleUpdate: async (vehicle_number: string) =>
    mock ? M.delay() : post('/driver/me/vehicle-change-requests', { vehicle_number }),

  setRideTypes: async (ride_types: Record<RideType, boolean>) => {
    if (mock) {
      await M.delay(150);
      M.db.driver.ride_types = ride_types;
      return ride_types;
    }
    return put<Record<RideType, boolean>>('/driver/ride-types', { ride_types });
  },

  setPopupSettings: async (s: PopupSettings) => {
    if (mock) {
      await M.delay(150);
      M.db.driver.popup_settings = s;
      return s;
    }
    return put<PopupSettings>('/driver/popup-settings', s);
  },

  setLanguage: async (language: 'en' | 'hi') =>
    mock ? ((M.db.driver.language = language), M.delay(50)) : put('/driver/language', { language }),

  deleteAccount: async () => (mock ? M.delay() : del('/driver/me', { confirm: 'DELETE' })),
};

// ───────────────────────── Onboarding ─────────────────────────
export interface OwnerForm {
  branch_city: string;
  full_name: string;
  mobile_1: string;
  mobile_2?: string;
  aadhaar: string;
  pan: string;
  gst?: string;
  upi_id?: string;
  bank_account: string;
  ifsc: string;
}
export interface DriverForm {
  is_owner_driver: boolean;
  name?: string;
  mobile?: string;
  aadhaar?: string;
  badge_no?: string;
  experience_years?: string;
  address?: string;
}
export interface VehicleForm {
  vehicle_type: VehicleType;
  vehicle_number: string;
  year: string;
  colour: string;
  owner_name?: string;
  fitness_valid_upto: string;
  puc_valid_upto: string;
  fastag_no?: string;
  has_gps: boolean;
  has_dashcam: boolean;
}

export const onboardingApi = {
  saveOwner: async (b: OwnerForm) => (mock ? M.delay() : put('/onboarding/owner', b)),
  saveDriver: async (b: DriverForm) => (mock ? M.delay() : put('/onboarding/driver', b)),
  saveVehicle: async (b: VehicleForm) => (mock ? M.delay() : put('/onboarding/vehicle', b)),
  saveCategories: async (categories: ServiceCategory[]) =>
    mock ? M.delay() : put('/onboarding/categories', { categories }),

  uploadDocument: async (key: DocumentKey, files: UploadFile[]) =>
    mock
      ? (await M.delay(600), { key, status: 'uploaded' as const })
      : upload<{ key: DocumentKey; status: 'uploaded' }>(`/onboarding/documents/${key}`, {}, { files }),

  submit: async () => {
    if (mock) {
      await M.delay();
      M.db.driver.onboarding_status = 'submitted';
      return { application_no: M.db.driver.application_no! };
    }
    return post<{ application_no: string }>('/onboarding/submit', { terms_accepted: true });
  },

  status: async () => {
    if (mock) {
      await M.delay(200);
      // Mock: the second status check (pull to refresh) approves the application.
      if (M.db.driver.onboarding_status === 'submitted' && ++M.db.statusPolls > 1) {
        M.db.driver.onboarding_status = 'approved';
      }
      return {
        status: M.db.driver.onboarding_status,
        application_no: M.db.driver.application_no!,
        steps: [
          { label: 'Owner and driver details', state: 'done' },
          { label: 'Vehicle details', state: 'done' },
          { label: 'Documents', state: 'in_review' },
          { label: 'Admin approval', state: 'pending' },
        ] as { label: string; state: 'done' | 'in_review' | 'pending' }[],
      };
    }
    return get<{
      status: Driver['onboarding_status'];
      application_no: string;
      steps: { label: string; state: 'done' | 'in_review' | 'pending' }[];
    }>('/onboarding/status');
  },

  plan: async () => (mock ? (await M.delay(), M.plan) : get<Plan>('/onboarding/plan')),

  /** Creates a payment order for the joining deposit (Razorpay / PhonePe on the backend). */
  payDeposit: async () => {
    if (mock) {
      await M.delay(800);
      M.db.driver.onboarding_status = 'active';
      return { paid: true } as PaymentResult;
    }
    return post<PaymentResult>('/onboarding/deposit');
  },
};

export interface PaymentResult {
  paid: boolean;
  order_id?: string;
  /** If set, open this URL (UPI intent or hosted checkout) and poll `paymentsApi.status`. */
  checkout_url?: string;
}

export const paymentsApi = {
  status: async (order_id: string) => (mock ? { paid: true } : get<{ paid: boolean }>(`/payments/${order_id}`)),
};

// ───────────────────────── Home & duty ─────────────────────────
export const dutyApi = {
  home: async () => (mock ? (await M.delay(200), { ...M.db.home }) : get<HomeSummary>('/driver/home')),

  goOnline: async (lat?: number, lng?: number) => {
    if (mock) {
      await M.delay();
      if (M.db.driver.lock) throw new ApiError('Your app is locked', 423, {}, 'app_locked');
      M.db.home.is_online = true;
      return { ...M.db.home };
    }
    return post<HomeSummary>('/driver/duty/online', { lat, lng });
  },

  goOffline: async (reason?: 'emergency' | 'vehicle' | 'health' | 'other', note?: string) => {
    if (mock) {
      await M.delay();
      M.db.home.is_online = false;
      return { penalty: reason === 'other' ? 100 : 0 };
    }
    return post<{ penalty: number }>('/driver/duty/offline', { reason, note });
  },

  pingLocation: async (lat: number, lng: number, heading?: number | null, speed?: number | null) =>
    mock ? undefined : post('/driver/location', { lat, lng, heading, speed }),
};

// ───────────────────────── Event feed (polling) ─────────────────────────
export interface FeedEvent {
  id: string | number;
  event: string;
  payload: any;
}
export const eventsApi = {
  since: async (after?: string | number) => (mock ? [] : get<FeedEvent[]>('/driver/events', { after })),
};

// ───────────────────────── Rides (instant offers) ─────────────────────────
export const ridesApi = {
  /** Dev helper: in mock mode, fabricate an offer of a given type. */
  mockOffer: (type: RideType) => ({ ...M.offers[type] }),

  offer: async (id: number) => {
    if (mock) return Object.values(M.offers).find((o) => o.id === id)!;
    return get<RideOffer>(`/rides/offers/${id}`);
  },

  accept: async (offer: RideOffer) => {
    if (mock) {
      await M.delay();
      M.db.activeRide = {
        ...offer,
        status: 'accepted',
        rider: { name: 'Anita Sharma', initials: 'AS', rating: 4.9 },
        time_left_min: offer.duration_min ? Math.min(offer.duration_min, 7) : 7,
        distance_left_km: 1.9,
        next_instruction: { distance_km: 1.2, text: 'Turn right at Bangaon Road' },
        time_used_min: 130,
        km_used: 31,
        package_hours: 8,
        package_km: 80,
      };
      return M.db.activeRide;
    }
    return post<ActiveRide>(`/rides/offers/${offer.id}/accept`);
  },

  decline: async (id: number) => (mock ? M.delay(100) : post(`/rides/offers/${id}/decline`)),

  active: async () => (mock ? (await M.delay(100), M.db.activeRide) : get<ActiveRide | null>('/rides/active')),

  arrived: async (id: number) => (mock ? M.delay() : post(`/rides/${id}/arrived`)),

  start: async (id: number, otp: string) => {
    if (mock) {
      await M.delay();
      M.assertOtp(otp, '4827');
      if (M.db.activeRide) M.db.activeRide.status = 'started';
      return M.db.activeRide!;
    }
    return post<ActiveRide>(`/rides/${id}/start`, { otp });
  },

  /** City / parcel: ends trip, returns cash to collect. */
  complete: async (id: number) => {
    if (mock) {
      await M.delay();
      return M.tripComplete(M.db.activeRide!);
    }
    return post<TripCompleteSummary>(`/rides/${id}/complete`);
  },

  cashCollected: async (id: number) => {
    if (mock) {
      await M.delay();
      M.db.activeRide = null;
      return;
    }
    return postOrQueue(`/rides/${id}/cash-collected`);
  },

  rateRider: async (id: number, rating: number) => (mock ? M.delay(100) : postOrQueue(`/rides/${id}/rate`, { rating })),

  cancel: async (id: number, reason: string) => {
    if (mock) {
      await M.delay();
      M.db.activeRide = null;
      return;
    }
    return post(`/rides/${id}/cancel`, { reason });
  },

  emergency: async (id: number, reason: string, lat?: number, lng?: number) => {
    if (mock) {
      await M.delay();
      M.db.activeRide = null;
      return { ticket_id: 'SOS-2231' };
    }
    return post<{ ticket_id: string }>(`/rides/${id}/emergency`, { reason, lat, lng });
  },

  addStop: async (id: number, place: string) => (mock ? M.delay() : post(`/rides/${id}/stops`, { place })),

  /** Outstation / rental / airport end-trip extras. */
  submitExtras: async (
    id: number,
    fields: Record<string, number | undefined>,
    files: { odometer?: UploadFile[]; receipts?: UploadFile[] },
  ) => {
    if (mock) {
      await M.delay(700);
      const f: Record<string, number> = {};
      Object.entries(fields).forEach(([k, v]) => v !== undefined && (f[k] = v));
      return M.fareBill(id, f);
    }
    return upload<FareBill>(`/rides/${id}/extras`, fields, {
      ...(files.odometer?.length ? { odometer_photos: files.odometer } : {}),
      ...(files.receipts?.length ? { receipts: files.receipts } : {}),
    });
  },

  bill: async (id: number) => {
    if (mock) {
      // Mock: the first poll after submit (~15s) shows the bill approved.
      await M.delay(200);
      return M.fareBill(
        id,
        { start_odo: 0, end_odo: 120, toll: 320, extra_toll: 80, waiting_min: 40, allowance: 900 },
        true,
      );
    }
    return get<FareBill>(`/rides/${id}/bill`);
  },
};

// ───────────────────────── Bookings (scheduled) ─────────────────────────
export const bookingsApi = {
  list: async (params: { tab?: 'live' | 'open' | 'upcoming'; type?: RideType | 'all' }) => {
    if (mock) {
      await M.delay(250);
      let list = M.bookings;
      if (params.type && params.type !== 'all') list = list.filter((b) => b.type === params.type);
      if (params.tab === 'upcoming') list = list.slice(1, 3);
      return list;
    }
    return get<Booking[]>('/bookings', params);
  },

  show: async (id: number) =>
    mock ? (await M.delay(150), M.bookings.find((b) => b.id === id)!) : get<Booking>(`/bookings/${id}`),

  /** 409 => taken by another driver; 422 code=schedule_conflict => cannot fit. */
  accept: async (id: number) => {
    if (mock) {
      await M.delay();
      if (id === 7004) throw new ApiError('Your ride ends too late.', 422, {}, 'schedule_conflict');
      if (Math.random() < 0.15) throw new ApiError('Booking just got taken', 409, {}, 'booking_taken');
      return M.bookings.find((b) => b.id === id)!;
    }
    return post<Booking>(`/bookings/${id}/accept`);
  },

  notifyWhenFree: async (id: number) => (mock ? M.delay() : post(`/bookings/${id}/notify-when-free`)),
};

// ───────────────────────── Leads ─────────────────────────
export interface LeadForm {
  kind: Lead['kind'];
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  vehicle_type: VehicleType;
  fare?: number;
  note?: string;
  contact_in_app: boolean;
}
export const leadsApi = {
  list: async (scope: 'all' | 'mine', kind: 'all' | Lead['kind']) => {
    if (mock) {
      await M.delay(200);
      return M.leads.filter((l) => (scope === 'mine' ? l.is_mine : !l.is_mine) && (kind === 'all' || l.kind === kind));
    }
    return get<Lead[]>('/leads', { scope, kind });
  },
  create: async (b: LeadForm) => {
    if (mock) {
      await M.delay();
      const l: Lead = {
        id: Date.now(),
        ...b,
        fare: b.fare ?? null,
        note: b.note ?? null,
        posted_ago: 'just now',
        driver_name: 'Ramesh K.',
        driver_rating: 4.8,
        is_mine: true,
      };
      M.leads.unshift(l);
      return l;
    }
    return post<Lead>('/leads', b);
  },
  contact: async (id: number) =>
    mock ? (await M.delay(), { thread_id: `lead-${id}` }) : post<{ thread_id: string }>(`/leads/${id}/contact`),
  remove: async (id: number) => (mock ? M.delay() : del(`/leads/${id}`)),
};

// ───────────────────────── Wallet ─────────────────────────
export const walletApi = {
  get: async () => (mock ? (await M.delay(200), { ...M.wallet }) : get<Wallet>('/wallet')),

  recharge: async (amount: number, method: 'upi' | 'card' | 'netbanking') => {
    if (mock) {
      await M.delay(800);
      M.wallet.balance += amount;
      M.db.home.wallet_balance = M.wallet.balance;
      if (M.db.driver.lock?.reason === 'wallet') M.db.driver.lock = null;
      return { paid: true } as PaymentResult;
    }
    return post<PaymentResult>('/wallet/recharge', { amount, method });
  },

  withdraw: async (amount: number, destination: 'bank' | 'upi') => {
    if (mock) {
      await M.delay();
      M.wallet.balance -= amount;
      M.wallet.withdrawable -= amount;
      return { reference: 'WD-88123' };
    }
    return post<{ reference: string }>('/wallet/withdraw', { amount, destination });
  },
};

// ───────────────────────── Earnings & trips ─────────────────────────
export const earningsApi = {
  get: async (period: Earnings['period']) =>
    mock ? (await M.delay(200), M.earnings(period)) : get<Earnings>('/earnings', { period }),
};

export const tripsApi = {
  list: async (params: {
    type?: RideType | 'all';
    status?: 'all' | 'completed' | 'cancelled_missed';
    range?: 'today' | 'week' | 'month' | 'all';
  }) => {
    if (mock) {
      await M.delay(200);
      return M.trips.filter(
        (t) =>
          (!params.type ||
            params.type === 'all' ||
            t.type === params.type ||
            (params.type === 'outstation_oneway' && t.type.startsWith('outstation'))) &&
          (!params.status ||
            params.status === 'all' ||
            (params.status === 'completed' ? t.status === 'completed' : t.status !== 'completed')),
      );
    }
    return get<TripRecord[]>('/trips', params);
  },
  /** Backend returns a signed, short-lived URL to the PDF. */
  reportUrl: async (params: object) =>
    mock
      ? (await M.delay(), { url: 'https://aolocabs.com/sample-report.pdf' })
      : get<{ url: string }>('/trips/report', params),
};

// ───────────────────────── Documents & locks ─────────────────────────
export const documentsApi = {
  list: async () => (mock ? (await M.delay(200), M.documents) : get<DriverDocument[]>('/documents')),

  upload: async (key: DocumentKey, files: UploadFile[], valid_till?: string) => {
    if (mock) {
      await M.delay(700);
      const d = M.documents.find((x) => x.key === key);
      if (d) {
        d.status = 'in_review';
        d.expiry_state = 'valid';
      }
      // Mock: pretend admin approved at once, so the lock lifts.
      if (M.db.driver.lock?.reason === key) M.db.driver.lock = null;
      return d!;
    }
    return upload<DriverDocument>(`/documents/${key}`, { valid_till }, { files });
  },

  requestInsurance: async (pay_with: 'wallet' | 'self') =>
    mock
      ? (await M.delay(), { request_id: 'INS-5521' })
      : post<{ request_id: string }>('/insurance-requests', { pay_with }),

  /** Dev helper so the lock screens can be previewed in mock mode. */
  mockLock: (reason: LockReason | null) => {
    M.db.driver.lock = reason
      ? reason === 'wallet'
        ? { reason, amount_due: 450, starting_balance: 2500, used_commission: 450, reminders_sent: 2 }
        : { reason, expired_on: '17 Nov 2026', vehicle_number: M.db.driver.vehicle_number }
      : null;
  },
};

// ───────────────────────── Penalties, legal, support ─────────────────────────
export const penaltyApi = {
  get: async () => (mock ? (await M.delay(200), M.penalty) : get<Penalty>('/penalties')),
};

export const legalApi = {
  acceptSla: async () => (mock ? M.delay() : post('/legal/sla/accept')),
  acknowledgePrivacy: async () => (mock ? M.delay(100) : post('/legal/privacy/acknowledge')),
};

export const supportApi = {
  sendMessage: async (message: string, topic?: string) =>
    mock
      ? (await M.delay(), { ticket_id: 'TCK-1029' })
      : post<{ ticket_id: string }>('/support/messages', { message, topic }),
  sos: async (lat?: number, lng?: number, ride_id?: number) =>
    mock
      ? (await M.delay(), { ticket_id: 'SOS-1' })
      : post<{ ticket_id: string }>('/support/sos', { lat, lng, ride_id }),
};
