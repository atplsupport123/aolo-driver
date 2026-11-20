// PDF p.17 — Create a lead
import React from 'react';
import { Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, Header, Segmented, FormInput, Row, ChipGroup, Button, Toggle, Muted } from '../../components/ui';
import { leadsApi, LeadForm } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAction } from '../../hooks/useApi';
import { useAuth } from '../../store/auth';
import { leadSchema, LeadValues, zodResolver, applyServerErrors, digits, dateMask } from '../../lib/schemas';
import { vehicleLabels } from '../../utils/format';
import { colors } from '../../theme';
import type { VehicleType } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

export default function CreateLeadScreen({ navigation }: ScreenProps<'CreateLead'>) {
  const qc = useQueryClient();
  const vehicle = useAuth((s) => s.driver?.vehicle_type) ?? 'sedan';
  const api = useAction(leadsApi.create);
  const { control, handleSubmit, setError } = useForm<LeadValues>({
    defaultValues: {
      kind: 'going_empty',
      vehicle_type: vehicle,
      contact_in_app: true,
      from_city: '',
      to_city: '',
      date: '',
      time: '',
      fare: '',
      note: '',
    },
    resolver: zodResolver<LeadValues>(leadSchema),
  });
  const kind = useWatch({ control, name: 'kind' });

  const submit = handleSubmit(async (v) => {
    try {
      await api.run({
        ...(v as unknown as LeadForm),
        fare: v.fare ? Number(v.fare) : undefined,
        note: v.note || undefined,
      });
      qc.invalidateQueries({ queryKey: ['leads'] });
      navigation.replace('PostedLeads');
    } catch (e) {
      if (e instanceof ApiError) applyServerErrors(setError, e.fieldErrors);
    }
  });

  return (
    <Screen footer={<Button title="Create lead" onPress={submit} loading={api.loading} />}>
      <Header title="Create a lead" />
      <Controller
        control={control}
        name="kind"
        render={({ field }) => (
          <Segmented
            options={[
              { key: 'going_empty', label: 'I am going empty' },
              { key: 'need_vehicle', label: 'I need a vehicle' },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Muted style={{ marginVertical: 12, fontSize: 13 }}>
        {kind === 'going_empty'
          ? 'Going back with no ride? Let other drivers know, so you can get a booking for the return trip.'
          : 'Have a booking but no free vehicle? Ask other drivers to take it.'}
      </Muted>
      <Row>
        <FormInput control={control} name="from_city" label="From city" placeholder="e.g. Patna" />
        <FormInput control={control} name="to_city" label="To city" placeholder="e.g. Saharsa" />
      </Row>
      <Row>
        <FormInput
          control={control}
          name="date"
          label="Date"
          placeholder="DD/MM/YYYY"
          keyboardType="number-pad"
          transform={dateMask}
        />
        <FormInput control={control} name="time" label="Time" placeholder="e.g. 4:00 PM" />
      </Row>
      <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>Vehicle type</Text>
      <Controller
        control={control}
        name="vehicle_type"
        render={({ field }) => (
          <ChipGroup<VehicleType>
            options={vehicleLabels.filter((v) => v.key !== 'other')}
            value={field.value as VehicleType}
            onChange={field.onChange}
          />
        )}
      />
      <View style={{ height: 14 }} />
      <FormInput
        control={control}
        name="fare"
        label="Fare you expect (optional)"
        prefix="₹"
        keyboardType="number-pad"
        transform={digits(6)}
      />
      <FormInput
        control={control}
        name="note"
        label="Note (optional)"
        placeholder="Seats free, luggage, any other detail"
        multiline
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 10,
          padding: 12,
        }}
      >
        <Text style={{ flex: 1, fontSize: 13 }}>Contact me through the app. My number stays hidden.</Text>
        <Controller
          control={control}
          name="contact_in_app"
          render={({ field }) => <Toggle value={!!field.value} onChange={field.onChange} />}
        />
      </View>
    </Screen>
  );
}
