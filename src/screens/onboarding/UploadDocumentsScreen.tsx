// PDF p.6 — Step 5 of 6: Upload documents
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text } from 'react-native';
import { Screen, Header, Button, SectionLabel, ListRow } from '../../components/ui';
import { useOnboarding } from '../../store/onboarding';
import { onboardingApi } from '../../api/endpoints';
import { pickFile } from '../../hooks/usePickFile';
import { colors } from '../../theme';
import type { DocumentKey } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

const DRIVER_DOCS: { key: DocumentKey; label: string; required: boolean }[] = [
  { key: 'aadhaar', label: 'Aadhaar card', required: true },
  { key: 'dl', label: 'Driving licence (DL)', required: true },
  { key: 'commercial_dl', label: 'Commercial DL / badge', required: true },
  { key: 'police_verification', label: 'Police verification', required: true },
  { key: 'photo', label: 'Passport size photo', required: true },
];
const VEHICLE_DOCS: { key: DocumentKey; label: string; required: boolean; multiple?: boolean }[] = [
  { key: 'rc', label: 'RC (registration certificate)', required: true },
  { key: 'insurance', label: 'Insurance certificate', required: true },
  { key: 'fitness', label: 'Fitness certificate', required: true },
  { key: 'permit', label: 'Permit (commercial)', required: true },
  { key: 'puc', label: 'PUC certificate', required: true },
  { key: 'fastag', label: 'FASTag copy', required: false },
  { key: 'tax_receipt', label: 'Tax receipt', required: false },
  { key: 'vehicle_photos', label: 'Vehicle photos (4 sides)', required: true, multiple: true },
];

export default function UploadDocumentsScreen({ navigation }: ScreenProps<'UploadDocuments'>) {
  const { uploaded, markUploaded } = useOnboarding();
  const [busy, setBusy] = useState<DocumentKey | null>(null);

  const upload = async (key: DocumentKey, multiple?: boolean) => {
    const files = await pickFile({ multiple, count: multiple ? 4 : 1, title: 'Document photo' });
    if (!files?.length) return;
    if (key === 'vehicle_photos' && files.length < 4) {
      Alert.alert('Add 4 photos', 'Front, back, left and right of the vehicle.');
      return;
    }
    setBusy(key);
    try {
      await onboardingApi.uploadDocument(key, files);
      markUploaded(key);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const missing = [...DRIVER_DOCS, ...VEHICLE_DOCS].filter((d) => d.required && !uploaded[d.key]);

  const row = (d: { key: DocumentKey; label: string; multiple?: boolean }) => (
    <ListRow
      key={d.key}
      title={d.label}
      right={
        busy === d.key ? (
          <ActivityIndicator />
        ) : (
          <Pressable onPress={() => upload(d.key, d.multiple)} hitSlop={8}>
            <Text style={{ fontWeight: '700', color: uploaded[d.key] ? colors.green : colors.text }}>
              {uploaded[d.key] ? 'Uploaded' : 'Upload'}
            </Text>
          </Pressable>
        )
      }
    />
  );

  return (
    <Screen
      footer={
        <Button
          title="Next"
          onPress={() =>
            missing.length
              ? Alert.alert('Documents missing', missing.map((m) => `• ${m.label}`).join('\n'))
              : navigation.navigate('Terms')
          }
        />
      }
    >
      <Header step={5} title="Upload documents" subtitle="Clear photos of the original documents." />
      <SectionLabel style={{ marginTop: 0 }}>Driver</SectionLabel>
      {DRIVER_DOCS.map(row)}
      <SectionLabel>Vehicle</SectionLabel>
      {VEHICLE_DOCS.map(row)}
    </Screen>
  );
}
