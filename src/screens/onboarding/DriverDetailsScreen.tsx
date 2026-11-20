// PDF p.3 — Step 2 of 6: Driver details
import React from 'react';
import { Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Screen, Header, FormInput, Row, Button, Toggle } from '../../components/ui';
import { useOnboarding } from '../../store/onboarding';
import { onboardingApi, DriverForm } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAction } from '../../hooks/useApi';
import { driverSchema, DriverValues, zodResolver, applyServerErrors, digits } from '../../lib/schemas';
import { colors } from '../../theme';
import type { ScreenProps } from '../../navigation/types';

export default function DriverDetailsScreen({ navigation }: ScreenProps<'DriverDetails'>) {
  const stored = useOnboarding((s) => s.driver);
  const save = useOnboarding((s) => s.set);
  const api = useAction(onboardingApi.saveDriver);
  const { control, handleSubmit, setError } = useForm<DriverValues>({
    defaultValues: { is_owner_driver: false, ...stored },
    resolver: zodResolver<DriverValues>(driverSchema),
  });
  const self = useWatch({ control, name: 'is_owner_driver' });

  const next = handleSubmit(async (values) => {
    try {
      await api.run(values as DriverForm);
      save('driver', values);
      navigation.navigate('VehicleDetails');
    } catch (e) {
      if (e instanceof ApiError) applyServerErrors(setError, e.fieldErrors);
    }
  });

  return (
    <Screen footer={<Button title="Next" onPress={next} loading={api.loading} />}>
      <Header step={2} title="Driver details" subtitle="Fill this only if the driver is different from the owner." />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: '600' }}>I am the driver myself</Text>
        <Controller
          control={control}
          name="is_owner_driver"
          render={({ field }) => <Toggle value={!!field.value} onChange={field.onChange} />}
        />
      </View>
      {!self && (
        <>
          <FormInput control={control} name="name" label="Driver full name" placeholder="As on DL" />
          <Row>
            <FormInput
              control={control}
              name="mobile"
              label="Mobile / WhatsApp"
              prefix="+91"
              keyboardType="phone-pad"
              transform={digits(10)}
            />
            <FormInput
              control={control}
              name="aadhaar"
              label="Aadhaar no."
              placeholder="0000 0000 0000"
              keyboardType="number-pad"
              transform={digits(12)}
            />
          </Row>
          <Row>
            <FormInput control={control} name="badge_no" label="Badge no. / taxi badge" placeholder="Badge number" />
            <FormInput
              control={control}
              name="experience_years"
              label="Experience (years)"
              placeholder="e.g. 5"
              keyboardType="number-pad"
              transform={digits(2)}
            />
          </Row>
          <FormInput
            control={control}
            name="address"
            label="Full address"
            placeholder="House, village or mohalla, city, PIN"
            multiline
          />
        </>
      )}
    </Screen>
  );
}
