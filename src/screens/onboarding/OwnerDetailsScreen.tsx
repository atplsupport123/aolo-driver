// PDF p.2 — Step 1 of 6: Fleet owner details
import React from 'react';
import { useForm } from 'react-hook-form';
import { Screen, Header, FormInput, Row, Button } from '../../components/ui';
import { useOnboarding } from '../../store/onboarding';
import { onboardingApi, OwnerForm } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { useAction } from '../../hooks/useApi';
import { ownerSchema, OwnerValues, zodResolver, applyServerErrors, digits } from '../../lib/schemas';
import { useAuth } from '../../store/auth';
import type { ScreenProps } from '../../navigation/types';

export default function OwnerDetailsScreen({ navigation }: ScreenProps<'OwnerDetails'>) {
  const stored = useOnboarding((s) => s.owner);
  const save = useOnboarding((s) => s.set);
  const logout = useAuth((s) => s.logout);
  const api = useAction(onboardingApi.saveOwner);
  const { control, handleSubmit, setError } = useForm<OwnerValues>({
    defaultValues: { gst: '', upi_id: '', mobile_2: '', ...(stored as OwnerValues) },
    resolver: zodResolver<OwnerValues>(ownerSchema),
  });

  const next = handleSubmit(async (values) => {
    const body = values as unknown as OwnerForm;
    try {
      await api.run(body);
      save('owner', body);
      navigation.navigate('DriverDetails');
    } catch (e) {
      if (e instanceof ApiError) applyServerErrors(setError, e.fieldErrors);
    }
  });

  return (
    <Screen footer={<Button title="Next" onPress={next} loading={api.loading} />}>
      <Header
        step={1}
        title="Fleet owner details"
        subtitle="The person whose vehicle is attached is the fleet owner."
        onBack={logout}
      />
      <Row>
        <FormInput control={control} name="branch_city" label="Branch / City" placeholder="e.g. Saharsa / Patna" />
        <FormInput control={control} name="full_name" label="Full name" placeholder="As on Aadhaar" />
      </Row>
      <Row>
        <FormInput
          control={control}
          name="mobile_1"
          label="Mobile no. 1"
          prefix="+91"
          keyboardType="phone-pad"
          transform={digits(10)}
        />
        <FormInput
          control={control}
          name="mobile_2"
          label="Mobile no. 2"
          prefix="+91"
          keyboardType="phone-pad"
          transform={digits(10)}
        />
      </Row>
      <Row>
        <FormInput
          control={control}
          name="aadhaar"
          label="Aadhaar number"
          placeholder="0000 0000 0000"
          keyboardType="number-pad"
          transform={digits(12)}
        />
        <FormInput
          control={control}
          name="pan"
          label="PAN number"
          placeholder="ABCDE1234F"
          autoCapitalize="characters"
          maxLength={10}
        />
      </Row>
      <Row>
        <FormInput
          control={control}
          name="gst"
          label="GST no. (if any)"
          placeholder="GST no."
          autoCapitalize="characters"
        />
        <FormInput control={control} name="upi_id" label="UPI ID" placeholder="name@upi" autoCapitalize="none" />
      </Row>
      <Row>
        <FormInput
          control={control}
          name="bank_account"
          label="Bank account no."
          placeholder="Account number"
          keyboardType="number-pad"
          transform={digits(18)}
        />
        <FormInput
          control={control}
          name="ifsc"
          label="IFSC code"
          placeholder="IFSC0000000"
          autoCapitalize="characters"
          maxLength={11}
        />
      </Row>
    </Screen>
  );
}
