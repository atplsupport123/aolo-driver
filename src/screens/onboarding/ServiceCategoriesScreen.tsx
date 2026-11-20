// PDF p.5 — Step 4 of 6: Service categories
import React from 'react';
import { Alert } from 'react-native';
import { Screen, Header, Button, CheckRow, Muted } from '../../components/ui';
import { useOnboarding } from '../../store/onboarding';
import { onboardingApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import type { ServiceCategory } from '../../api/types';
import type { ScreenProps } from '../../navigation/types';

const CATS: { key: ServiceCategory; label: string }[] = [
  { key: 'city', label: 'City ride' },
  { key: 'local_8_80', label: 'Local, 8 hrs / 80 km' },
  { key: 'outstation_oneway', label: 'Outstation, one way' },
  { key: 'outstation_round', label: 'Outstation, round trip' },
  { key: 'airport', label: 'Airport pickup / drop' },
  { key: 'wedding_event', label: 'Wedding / event booking' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'parcel', label: 'Parcel' },
];

export default function ServiceCategoriesScreen({ navigation }: ScreenProps<'ServiceCategories'>) {
  const { categories, setCategories } = useOnboarding();
  const api = useAction(onboardingApi.saveCategories);

  const toggle = (k: ServiceCategory) =>
    setCategories(categories.includes(k) ? categories.filter((c) => c !== k) : [...categories, k]);

  const next = async () => {
    if (!categories.length) return Alert.alert('Pick at least one', 'Tick the rides you want to take.');
    try {
      await api.run(categories);
      navigation.navigate('UploadDocuments');
    } catch {
      /* shown */
    }
  };

  return (
    <Screen footer={<Button title="Next" onPress={next} loading={api.loading} />}>
      <Header step={4} title="Service categories" subtitle="Tick every kind of ride you want to take." />
      {CATS.map((c) => (
        <CheckRow key={c.key} label={c.label} checked={categories.includes(c.key)} onPress={() => toggle(c.key)} />
      ))}
      <Muted style={{ marginTop: 8 }}>Toto and bike drivers will see only the rides that fit their vehicle.</Muted>
    </Screen>
  );
}
