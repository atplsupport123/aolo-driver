import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/auth';
import { useRide } from '../store/ride';
import { Loading } from '../components/ui';
import OfflineBanner from '../components/OfflineBanner';
import { navRef } from './navRef';
import { setupPush } from '../lib/push';
import { useEventFeed } from '../hooks/useEventFeed';
import { colors } from '../theme';
import type { RootStackParamList } from './types';
import MainTabs from './MainTabs';
import MenuScreen from '../screens/home/MenuScreen';
import CameraScreen from '../screens/common/CameraScreen';

// auth
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import OtpScreen from '../screens/auth/OtpScreen';
// onboarding
import OwnerDetailsScreen from '../screens/onboarding/OwnerDetailsScreen';
import DriverDetailsScreen from '../screens/onboarding/DriverDetailsScreen';
import VehicleDetailsScreen from '../screens/onboarding/VehicleDetailsScreen';
import ServiceCategoriesScreen from '../screens/onboarding/ServiceCategoriesScreen';
import UploadDocumentsScreen from '../screens/onboarding/UploadDocumentsScreen';
import TermsScreen from '../screens/onboarding/TermsScreen';
import ApplicationSubmittedScreen from '../screens/onboarding/ApplicationSubmittedScreen';
import PlanScreen from '../screens/onboarding/PlanScreen';
// home & profile
import RideTypesScreen from '../screens/profile/RideTypesScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import DeleteAccountScreen from '../screens/profile/DeleteAccountScreen';
import GoOfflineSheet from '../screens/home/GoOfflineSheet';
import DevToolsScreen from '../screens/home/DevToolsScreen';
// bookings & leads
import OutstationBookingsScreen from '../screens/booking/OutstationBookingsScreen';
import BookingsScreen from '../screens/booking/BookingsScreen';
import BookingDetailScreen from '../screens/booking/BookingDetailScreen';
import BookingPopupScreen from '../screens/booking/BookingPopupScreen';
import BookingAddedScreen from '../screens/booking/BookingAddedScreen';
import BookingTakenScreen from '../screens/booking/BookingTakenScreen';
import BookingPopupSettingsScreen from '../screens/booking/BookingPopupSettingsScreen';
import CreateLeadScreen from '../screens/leads/CreateLeadScreen';
import PostedLeadsScreen from '../screens/leads/PostedLeadsScreen';
// ride
import RideRequestScreen from '../screens/ride/RideRequestScreen';
import PickupOtpScreen from '../screens/ride/PickupOtpScreen';
import TripInProgressScreen from '../screens/ride/TripInProgressScreen';
import RentalModeScreen from '../screens/ride/RentalModeScreen';
import TripCompleteScreen from '../screens/ride/TripCompleteScreen';
import EmergencyHandoverScreen from '../screens/ride/EmergencyHandoverScreen';
import EndTripExtrasScreen from '../screens/ride/EndTripExtrasScreen';
import FareBillScreen from '../screens/ride/FareBillScreen';
// documents
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import DocumentExpiringScreen from '../screens/documents/DocumentExpiringScreen';
import LockedScreen from '../screens/documents/LockedScreen';
import InsuranceNowScreen from '../screens/documents/InsuranceNowScreen';
import InsuranceRequestedScreen from '../screens/documents/InsuranceRequestedScreen';
// money
import RideHistoryScreen from '../screens/trips/RideHistoryScreen';
import RechargeScreen from '../screens/wallet/RechargeScreen';
import WithdrawScreen from '../screens/wallet/WithdrawScreen';
import PenaltyScreen from '../screens/wallet/PenaltyScreen';
// support & legal
import SupportScreen from '../screens/support/SupportScreen';
import ContactUsScreen from '../screens/support/ContactUsScreen';
import SlaScreen from '../screens/legal/SlaScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';
import PenaltyStructureScreen from '../screens/legal/PenaltyStructureScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
export { navRef };

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary } };

export default function RootNavigator() {
  const { ready, token, driver } = useAuth();
  const active = useRide((s) => s.active);

  const isActive = driver?.onboarding_status === 'active';
  useEventFeed(!!token && isActive);
  useEffect(() => {
    if (!token || !isActive) return;
    let cleanup: (() => void) | undefined;
    setupPush().then((c) => (cleanup = c));
    return () => cleanup?.();
  }, [token, isActive]);

  if (!ready) return <Loading />;

  const status = driver?.onboarding_status;
  // A lock never interrupts a ride in progress (PDF p.42): it starts after the ride ends.
  const locked = !!driver?.lock && !active;

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navRef} theme={theme}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {!token ? (
            <Stack.Group>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Otp" component={OtpScreen} />
            </Stack.Group>
          ) : status === 'submitted' ? (
            <Stack.Group>
              <Stack.Screen name="ApplicationSubmitted" component={ApplicationSubmittedScreen} />
              <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            </Stack.Group>
          ) : status === 'approved' ? (
            <Stack.Group>
              <Stack.Screen name="Plan" component={PlanScreen} />
              <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            </Stack.Group>
          ) : status !== 'active' ? (
            <Stack.Group>
              <Stack.Screen name="OwnerDetails" component={OwnerDetailsScreen} />
              <Stack.Screen name="DriverDetails" component={DriverDetailsScreen} />
              <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
              <Stack.Screen name="ServiceCategories" component={ServiceCategoriesScreen} />
              <Stack.Screen name="UploadDocuments" component={UploadDocumentsScreen} />
              <Stack.Screen name="Terms" component={TermsScreen} />
              <Stack.Screen name="PenaltyStructure" component={PenaltyStructureScreen} />
              <Stack.Screen name="ApplicationSubmitted" component={ApplicationSubmittedScreen} />
              <Stack.Screen
                name="Camera"
                component={CameraScreen}
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
            </Stack.Group>
          ) : locked ? (
            <Stack.Group>
              <Stack.Screen name="Locked" component={LockedScreen} />
              <Stack.Screen name="Recharge" component={RechargeScreen} />
              <Stack.Screen name="Documents" component={DocumentsScreen} />
              <Stack.Screen name="InsuranceNow" component={InsuranceNowScreen} />
              <Stack.Screen name="InsuranceRequested" component={InsuranceRequestedScreen} />
              <Stack.Screen name="ContactUs" component={ContactUsScreen} />
              <Stack.Screen name="Support" component={SupportScreen} />
              <Stack.Screen name="DevTools" component={DevToolsScreen} />
              <Stack.Screen
                name="Camera"
                component={CameraScreen}
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
            </Stack.Group>
          ) : (
            <>
              <Stack.Group>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="RideTypes" component={RideTypesScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="OutstationBookings" component={OutstationBookingsScreen} />
                <Stack.Screen name="CreateLead" component={CreateLeadScreen} />
                <Stack.Screen name="PostedLeads" component={PostedLeadsScreen} />
                <Stack.Screen name="Support" component={SupportScreen} />
                <Stack.Screen name="Bookings" component={BookingsScreen} />
                <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
                <Stack.Screen name="BookingPopupSettings" component={BookingPopupSettingsScreen} />
                <Stack.Screen name="PickupOtp" component={PickupOtpScreen} options={{ gestureEnabled: false }} />
                <Stack.Screen
                  name="TripInProgress"
                  component={TripInProgressScreen}
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="RentalMode" component={RentalModeScreen} options={{ gestureEnabled: false }} />
                <Stack.Screen name="TripComplete" component={TripCompleteScreen} options={{ gestureEnabled: false }} />
                <Stack.Screen name="EmergencyHandover" component={EmergencyHandoverScreen} />
                <Stack.Screen name="EndTripExtras" component={EndTripExtrasScreen} />
                <Stack.Screen name="FareBill" component={FareBillScreen} options={{ gestureEnabled: false }} />
                <Stack.Screen name="Documents" component={DocumentsScreen} />
                <Stack.Screen name="InsuranceNow" component={InsuranceNowScreen} />
                <Stack.Screen name="InsuranceRequested" component={InsuranceRequestedScreen} />
                <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
                <Stack.Screen name="Recharge" component={RechargeScreen} />
                <Stack.Screen name="Withdraw" component={WithdrawScreen} />
                <Stack.Screen name="Penalty" component={PenaltyScreen} />
                <Stack.Screen name="PenaltyStructure" component={PenaltyStructureScreen} />
                <Stack.Screen name="Sla" component={SlaScreen} />
                <Stack.Screen name="Privacy" component={PrivacyScreen} />
                <Stack.Screen name="ContactUs" component={ContactUsScreen} />
                <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
                <Stack.Screen name="DevTools" component={DevToolsScreen} />
              </Stack.Group>
              <Stack.Group
                screenOptions={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  gestureEnabled: false,
                }}
              >
                <Stack.Screen name="RideRequest" component={RideRequestScreen} />
                <Stack.Screen name="BookingAdded" component={BookingAddedScreen} />
                <Stack.Screen name="Camera" component={CameraScreen} />
              </Stack.Group>
              <Stack.Group screenOptions={{ presentation: 'transparentModal', animation: 'fade' }}>
                <Stack.Screen name="Menu" component={MenuScreen} options={{ animation: 'none' }} />
                <Stack.Screen name="GoOffline" component={GoOfflineSheet} />
                <Stack.Screen name="BookingPopup" component={BookingPopupScreen} />
                <Stack.Screen name="BookingTaken" component={BookingTakenScreen} />
                <Stack.Screen name="DocumentExpiring" component={DocumentExpiringScreen} />
              </Stack.Group>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <OfflineBanner />
    </View>
  );
}
