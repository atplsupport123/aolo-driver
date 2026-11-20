import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Booking, DocumentKey, FareBill, LockReason, RideOffer } from '../api/types';

export type RootStackParamList = {
  // auth
  Welcome: undefined;
  Otp: undefined;
  // onboarding
  OwnerDetails: undefined;
  DriverDetails: undefined;
  VehicleDetails: undefined;
  ServiceCategories: undefined;
  UploadDocuments: undefined;
  Terms: undefined;
  ApplicationSubmitted: undefined;
  Plan: undefined;
  // locked
  Locked: { reason?: LockReason } | undefined;
  // main
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Menu: undefined;
  Camera: { count?: number; title?: string } | undefined;
  RideTypes: undefined;
  EditProfile: undefined;
  GoOffline: undefined;
  OutstationBookings: undefined;
  CreateLead: undefined;
  PostedLeads: undefined;
  Support: undefined;
  // instant rides
  RideRequest: { offer: RideOffer };
  PickupOtp: undefined;
  TripInProgress: undefined;
  RentalMode: undefined;
  TripComplete: undefined;
  EmergencyHandover: undefined;
  EndTripExtras: undefined;
  FareBill: { bill?: FareBill; rideId: number };
  // bookings
  Bookings: undefined;
  BookingDetail: { id: number };
  BookingPopup: { booking: Booking; duringRide?: boolean };
  BookingAdded: { booking: Booking };
  BookingTaken: { booking: Booking };
  BookingPopupSettings: undefined;
  // documents
  Documents: undefined;
  DocumentExpiring: { key: DocumentKey; label: string; endsAt?: string };
  InsuranceNow: undefined;
  InsuranceRequested: undefined;
  // money
  RideHistory: undefined;
  Recharge: { amount?: number } | undefined;
  Withdraw: undefined;
  Penalty: undefined;
  // legal & account
  PenaltyStructure: undefined;
  Sla: undefined;
  Privacy: undefined;
  ContactUs: undefined;
  DeleteAccount: undefined;
  DevTools: undefined;
};

export type TabParamList = {
  Home: undefined;
  Earnings: undefined;
  WalletTab: undefined;
  Trips: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
