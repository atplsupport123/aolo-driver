// PDF p.7 — Application submitted (in review)
import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Button, H1, Muted, StepList } from '../../components/ui';
import { onboardingApi } from '../../api/endpoints';
import { useAuth } from '../../store/auth';
import { colors } from '../../theme';
import type { ScreenProps } from '../../navigation/types';

export default function ApplicationSubmittedScreen({ navigation }: ScreenProps<'ApplicationSubmitted'>) {
  const setDriver = useAuth((s) => s.setDriver);
  const q = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const s = await onboardingApi.status();
      // When admin approves, Root navigator switches to the Plan screen.
      if (s.status !== 'submitted') setDriver({ onboarding_status: s.status });
      return s;
    },
    refetchInterval: 60_000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'center' }}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} />}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.amberSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.amber }}>!</Text>
        </View>
        <H1>Application submitted</H1>
        <Muted style={{ fontSize: 14, marginTop: 6, marginBottom: 16 }}>
          AOLO is checking your documents. We will tell you by SMS and in the app.
        </Muted>
        <StepList steps={(q.data?.steps ?? []) as any} />
        <Muted style={{ marginTop: 12 }}>Application no. {q.data?.application_no ?? '—'}</Muted>
      </ScrollView>
      <View style={{ padding: 16 }}>
        <Button title="Contact support" variant="outline" onPress={() => navigation.navigate('ContactUs')} />
      </View>
    </SafeAreaView>
  );
}
