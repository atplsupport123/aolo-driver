// PDF p.1 — Verify your number
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Screen, Header, OtpInput, Button, Spacer } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { useAction } from '../../hooks/useApi';
import { useCountdown } from '../../hooks/useCountdown';
import { colors, font } from '../../theme';
import { mmss } from '../../utils/format';
import { config } from '../../api/config';
import { MOCK_OTP } from '../../api/mock';

export default function OtpScreen() {
  const { pendingMobile, pendingIntent, verifyOtp, startOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [resendKey, setResendKey] = useState(0);
  const left = useCountdown(30, undefined, resendKey);
  const verify = useAction(verifyOtp);
  const resend = useAction(startOtp);

  const masked = pendingMobile ? `+91 ${pendingMobile.slice(0, 5)} ${pendingMobile.slice(5)}` : '';

  return (
    <Screen
      footer={
        <Button
          title="Verify and continue"
          disabled={otp.length !== 6}
          loading={verify.loading}
          onPress={() => verify.fire(otp)}
        />
      }
    >
      <Header title="Verify your number" subtitle={`Enter the 6 digit OTP sent to ${masked}`} />
      {config.useMock ? (
        <Text style={[font.small, { color: colors.amber, marginBottom: 12 }]}>
          Sample mode: no SMS is sent. Use OTP {MOCK_OTP} to continue.
        </Text>
      ) : null}
      <OtpInput length={6} value={otp} onChange={setOtp} />
      {verify.fieldErrors.otp ? (
        <Text style={{ color: colors.red, marginTop: 8 }}>{verify.fieldErrors.otp}</Text>
      ) : null}
      <Spacer />
      {left > 0 ? (
        <Text style={font.small}>Resend OTP in {mmss(left)}</Text>
      ) : (
        <Pressable
          onPress={async () => {
            if (!pendingMobile) return;
            await resend.run(pendingMobile, pendingIntent).catch(() => {});
            setResendKey((k) => k + 1);
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.text }}>Resend OTP</Text>
        </Pressable>
      )}
    </Screen>
  );
}
