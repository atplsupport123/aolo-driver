// PDF p.9 — Drive with AOLO
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Screen, Button } from '../../components/ui';
import { colors } from '../../theme';
import { useAuth } from '../../store/auth';
import { useAction } from '../../hooks/useApi';
import { ApiError } from '../../api/client';
import { mobileSchema, zodResolver, digits } from '../../lib/schemas';
import type { ScreenProps } from '../../navigation/types';

type Values = { mobile: string };

export default function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  const startOtp = useAuth((s) => s.startOtp);
  const [intent, setIntent] = useState<'register' | 'login'>('register');
  const { run, loading } = useAction(startOtp);
  const { control, handleSubmit, setError } = useForm<Values>({
    defaultValues: { mobile: '' },
    resolver: zodResolver<Values>(mobileSchema),
  });

  const go = (i: 'register' | 'login') =>
    handleSubmit(async ({ mobile }) => {
      setIntent(i);
      try {
        await run(mobile, i);
        navigation.navigate('Otp');
      } catch (e) {
        if (e instanceof ApiError && e.fieldErrors.mobile)
          setError('mobile', { type: 'server', message: e.fieldErrors.mobile });
      }
    })();

  return (
    <Screen dark scroll={false}>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: 24 }}>
        <View>
          <Text style={{ color: colors.darkMuted, letterSpacing: 2, fontSize: 12 }}>AOLO CABS</Text>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 8 }}>Drive with AOLO</Text>
          <Text style={{ color: colors.darkMuted, fontSize: 15, marginTop: 8, lineHeight: 21 }}>
            City, outstation, rental, airport and parcel rides. Earn on your own time.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.darkMuted, fontSize: 12 }}>Mobile number</Text>
          <Controller
            control={control}
            name="mobile"
            render={({ field, fieldState }) => (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.darkCard,
                    borderRadius: 8,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, marginRight: 8 }}>+91</Text>
                  <TextInput
                    value={field.value}
                    onChangeText={(t) => field.onChange(digits(10)(t))}
                    onBlur={field.onBlur}
                    keyboardType="phone-pad"
                    placeholder="10 digit number"
                    placeholderTextColor="#777"
                    style={{ flex: 1, color: '#fff', fontSize: 16, paddingVertical: 14 }}
                  />
                </View>
                {fieldState.error ? (
                  <Text style={{ color: '#ff8a80', fontSize: 12 }}>{fieldState.error.message}</Text>
                ) : null}
              </>
            )}
          />
          <Button
            title="Create new account"
            variant="light"
            onPress={() => go('register')}
            loading={loading && intent === 'register'}
          />
          <Button
            title="I am an existing driver"
            variant="lightOutline"
            onPress={() => go('login')}
            loading={loading && intent === 'login'}
          />
          <Text style={{ color: colors.darkMuted, textAlign: 'center', fontSize: 12, marginTop: 4 }}>
            We will send an OTP to verify your number
          </Text>
        </View>
      </View>
    </Screen>
  );
}
