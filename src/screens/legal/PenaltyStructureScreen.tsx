// PDF p.66 — Penalty structure (दंड एवं जुर्माना संरचना)
// Offence names are placeholders in the PDF — AOLO to supply. Serve from
// GET /legal/penalty-structure once final.
import React from 'react';
import { Text, View } from 'react-native';
import { Screen, Header, Banner } from '../../components/ui';
import { colors, font } from '../../theme';

const ROWS: { offence: string; penalty: string; action: string }[] = [
  { offence: '[Offence name]', penalty: '₹500 – ₹2,000', action: 'Warning / Penalty' },
  { offence: '[Offence name]', penalty: '₹300 – ₹1,000', action: 'Penalty + Warning' },
  { offence: '[Offence name]', penalty: '₹1,000 – ₹5,000', action: 'Suspension' },
  { offence: '[Offence name]', penalty: 'Full Recovery + ₹1,000 – 5,000', action: 'Suspension' },
  { offence: '[Offence name]', penalty: '₹5,000 – ₹25,000', action: 'Permanent Block' },
  { offence: '[Offence name]', penalty: '₹2,000 – ₹10,000', action: 'Block + Legal Action' },
  { offence: '[Offence name]', penalty: 'Full Deposit + FIR', action: 'Permanent Block' },
  { offence: '[Offence name]', penalty: '₹1,000 + Legal', action: '3 Month Suspension' },
  { offence: '[Offence name]', penalty: 'Full Recovery + Legal', action: 'Permanent Block + FIR' },
  { offence: '[Offence name]', penalty: '₹1,000 – ₹5,000', action: 'Suspension' },
  { offence: '[Offence name]', penalty: '₹500 – ₹2,000', action: 'Penalty + Warning' },
  { offence: '[Offence name]', penalty: '₹2,000 – ₹10,000', action: 'Suspension + Recovery' },
  { offence: '[Offence name]', penalty: 'Full Recovery + FIR', action: 'Permanent Block + FIR' },
  { offence: '[Offence name]', penalty: 'Full Recovery + Legal', action: 'Permanent Block' },
  { offence: '[Offence name]', penalty: '₹500 – ₹3,000', action: 'Penalty + Warning' },
  { offence: '[Offence name]', penalty: '10% Interest / Day', action: 'ID Suspend' },
  { offence: '[Offence name]', penalty: '₹500 – ₹2,000', action: 'Warning / Penalty' },
];

export default function PenaltyStructureScreen() {
  return (
    <Screen>
      <Header title="Penalty structure" subtitle="दंड एवं जुर्माना संरचना" />
      <Banner
        tone="red"
        text={
          'Penalties may be deducted from the security deposit or dues without prior notice.\nजुर्माना सुरक्षा जमा या बकाया भुगतान से बिना पूर्व सूचना काटा जा सकता है।'
        }
      />
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 10,
          marginTop: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.primary,
        }}
      >
        <Text style={[font.label, { flex: 1 }]}>Penalty / जुर्माना</Text>
        <Text style={[font.label, { width: 120, textAlign: 'right' }]}>Action / कार्रवाई</Text>
      </View>
      {ROWS.map((r, i) => (
        <View
          key={i}
          style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={font.small}>
              {i + 1} · {r.offence}
            </Text>
            <Text style={{ fontWeight: '700', marginTop: 2 }}>{r.penalty}</Text>
          </View>
          <Text
            style={{
              width: 120,
              textAlign: 'right',
              fontWeight: '600',
              color: r.action.includes('Block') ? colors.red : colors.text,
            }}
          >
            {r.action}
          </Text>
        </View>
      ))}
    </Screen>
  );
}
