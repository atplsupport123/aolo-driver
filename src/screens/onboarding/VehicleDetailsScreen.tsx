// PDF p.4 — Step 3 of 6: Vehicle details
import React from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Screen, Header, FormInput, Row, Button, ChipGroup, Chip, SectionLabel, Muted } from '../../components/ui';
import { useOnboarding } from '../../store/onboarding';
import { onboardingApi, VehicleForm } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAction } from '../../hooks/useApi';
import { vehicleSchema, VehicleValues, zodResolver, applyServerErrors, digits, dateMask } from '../../lib/schemas';
import { vehicleLabels } from '../../utils/format';
import type { VehicleType } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

export default function VehicleDetailsScreen({ navigation }: ScreenProps<'VehicleDetails'>) {
  const stored = useOnboarding((s) => s.vehicle);
  const save = useOnboarding((s) => s.set);
  const api = useAction(onboardingApi.saveVehicle);
  const { control, handleSubmit, setError } = useForm<VehicleValues>({
    defaultValues: {
      ...(stored as Partial<VehicleValues>),
      vehicle_type: stored.vehicle_type ?? 'sedan',
      has_gps: stored.has_gps ?? true,
      has_dashcam: stored.has_dashcam ?? false,
      owner_name: stored.owner_name ?? '',
      fastag_no: stored.fastag_no ?? '',
    },
    resolver: zodResolver<VehicleValues>(vehicleSchema),
  });

  const next = handleSubmit(async (values) => {
    try {
      await api.run(values as VehicleForm);
      save('vehicle', values as VehicleForm);
      navigation.navigate('ServiceCategories');
    } catch (e) {
      if (e instanceof ApiError) applyServerErrors(setError, e.fieldErrors);
    }
  });

  return (
    <Screen footer={<Button title="Next" onPress={next} loading={api.loading} />}>
      <Header step={3} title="Vehicle details" subtitle="Choose your vehicle type, then fill in the details." />
      <SectionLabel style={{ marginTop: 0 }}>Vehicle type</SectionLabel>
      <Controller
        control={control}
        name="vehicle_type"
        render={({ field }) => (
          <ChipGroup<VehicleType>
            options={vehicleLabels}
            value={field.value as VehicleType}
            onChange={field.onChange}
          />
        )}
      />
      <View style={{ height: 16 }} />
      <Row>
        <FormInput
          control={control}
          name="vehicle_number"
          label="Vehicle number"
          placeholder="BR 00 XX 0000"
          autoCapitalize="characters"
        />
        <FormInput
          control={control}
          name="year"
          label="Year of manufacture"
          placeholder="e.g. 2020"
          keyboardType="number-pad"
          transform={digits(4)}
        />
      </Row>
      <Row>
        <FormInput control={control} name="colour" label="Vehicle colour" placeholder="e.g. White" />
        <FormInput control={control} name="owner_name" label="Owner name (if different)" placeholder="Owner name" />
      </Row>
      <Row>
        <FormInput
          control={control}
          name="fitness_valid_upto"
          label="Fitness valid upto"
          placeholder="DD/MM/YYYY"
          keyboardType="number-pad"
          transform={dateMask}
        />
        <FormInput
          control={control}
          name="puc_valid_upto"
          label="PUC valid upto"
          placeholder="DD/MM/YYYY"
          keyboardType="number-pad"
          transform={dateMask}
        />
      </Row>
      <Row>
        <FormInput control={control} name="fastag_no" label="FASTag no." placeholder="FASTag number" />
        <View>
          <Muted style={{ marginBottom: 6 }}>GPS and dashcam</Muted>
          <View style={{ gap: 6, alignItems: 'flex-start' }}>
            <Controller
              control={control}
              name="has_gps"
              render={({ field }) => (
                <Chip
                  label={`GPS ${field.value ? 'yes' : 'no'}`}
                  selected={!!field.value}
                  onPress={() => field.onChange(!field.value)}
                />
              )}
            />
            <Controller
              control={control}
              name="has_dashcam"
              render={({ field }) => (
                <Chip
                  label={`Dashcam ${field.value ? 'yes' : 'no'}`}
                  selected={!!field.value}
                  onPress={() => field.onChange(!field.value)}
                />
              )}
            />
          </View>
        </View>
      </Row>
    </Screen>
  );
}
