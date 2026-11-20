// PDF p.50 (outstation), p.51 (rental), p.52 (airport) — End trip: add extras
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen, Header, Input, Row, Button, SectionLabel, Banner, Pill, Muted } from '../../components/ui';
import { ridesApi, UploadFile } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { pickFile } from '../../hooks/usePickFile';
import { useRide } from '../../store/ride';
import { colors } from '../../theme';
import { inr, rideTypeShort } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(/[^\d.]/g, '')));
const toMin = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
};

export default function EndTripExtrasScreen({ navigation }: ScreenProps<'EndTripExtras'>) {
  const ride = useRide((s) => s.active);
  const patchActive = useRide((s) => s.patchActive);
  const [v, setV] = useState<Record<string, string>>({});
  const [odoPhotos, setOdoPhotos] = useState<UploadFile[]>([]);
  const [receipts, setReceipts] = useState<UploadFile[]>([]);
  const submit = useAction(ridesApi.submitExtras);
  const on = (k: string) => (t: string) => setV((p) => ({ ...p, [k]: t }));

  const type = ride?.type ?? 'outstation_oneway';
  const isRental = type === 'rental';
  const isAirport = type === 'airport';
  const kmRate = ride?.extra_km_rate ?? 14;
  const hrRate = ride?.extra_hour_rate ?? 150;
  const bookedKm = isRental ? (ride?.package_km ?? 80) : (ride?.distance_km ?? 100);
  const freeWait = isAirport ? 45 : 30;

  const calc = useMemo(() => {
    const s = num(v.start_odo ?? ''),
      e = num(v.end_odo ?? '');
    const run = s !== undefined && e !== undefined && e >= s ? e - s : undefined;
    const extraKm = run !== undefined ? Math.max(0, run - bookedKm) : undefined;
    const st = toMin(v.start_time ?? ''),
      et = toMin(v.end_time ?? '');
    const usedMin = st !== undefined && et !== undefined ? (et >= st ? et - st : et + 1440 - st) : undefined;
    const pkgMin = (ride?.package_hours ?? 8) * 60;
    const extraMin = usedMin !== undefined ? Math.max(0, usedMin - pkgMin) : undefined;
    const wait = num(v.waiting_min ?? '');
    const extraWait = wait !== undefined ? Math.max(0, wait - freeWait) : undefined;
    return { run, extraKm, usedMin, pkgMin, extraMin, wait, extraWait };
  }, [v, bookedKm, freeWait, ride?.package_hours]);

  if (!ride) return null;

  const addPhotos = async (set: React.Dispatch<React.SetStateAction<UploadFile[]>>) => {
    const f = await pickFile({ multiple: true });
    if (f) set((p) => [...p, ...f]);
  };

  const onSubmit = async () => {
    const fields = {
      start_odo: num(v.start_odo ?? ''),
      end_odo: num(v.end_odo ?? ''),
      start_time: toMin(v.start_time ?? ''),
      end_time: toMin(v.end_time ?? ''),
      toll: num(v.toll ?? ''),
      extra_toll: num(v.extra_toll ?? ''),
      parking: num(v.parking ?? ''),
      waiting_min: num(v.waiting_min ?? ''),
      allowance: num(v.allowance ?? ''),
      extra_km: num(v.extra_km ?? ''),
    };
    try {
      const bill = await submit.run(ride.id, fields, { odometer: odoPhotos, receipts });
      patchActive({ status: 'bill_submitted' });
      navigation.replace('FareBill', { bill, rideId: ride.id });
    } catch {
      /* shown */
    }
  };

  const Calc = ({ children }: { children: React.ReactNode }) => (
    <Banner tone="gray" style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 13 }}>{children}</Text>
    </Banner>
  );
  const PhotoBtn = ({
    label,
    files,
    set,
  }: {
    label: string;
    files: UploadFile[];
    set: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  }) => (
    <Pressable
      onPress={() => addPhotos(set)}
      style={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.borderStrong,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <Text style={{ fontWeight: '600' }}>{files.length ? `${files.length} photo(s) added · add more` : label}</Text>
    </Pressable>
  );

  const title = isAirport ? 'Add extra charges' : 'End trip: add extras';
  const sub = isRental
    ? `Rental · ${ride.package_label ?? '8 hr / 80 km'} package`
    : isAirport
      ? `Airport pickup · ${ride.pickup.name.split(',')[0]}`
      : `${rideTypeShort[type]} · Booked ${bookedKm} km`;

  return (
    <Screen footer={<Button title="Complete ride" onPress={onSubmit} loading={submit.loading} />}>
      <Header title={title} subtitle={sub} />

      {isAirport ? (
        <>
          <SectionLabel style={{ marginTop: 0 }}>Airport charges</SectionLabel>
          <Row>
            <Input
              label="Airport parking (₹)"
              keyboardType="number-pad"
              value={v.parking}
              onChangeText={on('parking')}
            />
            <Input label="Toll paid (₹)" keyboardType="number-pad" value={v.toll} onChangeText={on('toll')} />
          </Row>
          <PhotoBtn label="Add receipts" files={receipts} set={setReceipts} />
        </>
      ) : (
        <>
          <SectionLabel style={{ marginTop: 0 }}>Extra km</SectionLabel>
          <Row>
            <Input
              label="Start odometer (km)"
              keyboardType="number-pad"
              value={v.start_odo}
              onChangeText={on('start_odo')}
            />
            <Input label="End odometer (km)" keyboardType="number-pad" value={v.end_odo} onChangeText={on('end_odo')} />
          </Row>
          <PhotoBtn label="Add odometer photos" files={odoPhotos} set={setOdoPhotos} />
          {calc.run !== undefined && (
            <Calc>
              Total run <B>{calc.run} km</B>. {isRental ? 'Package' : 'Booked'} {bookedKm} km. Extra{' '}
              <B>{calc.extraKm} km</B> at {inr(kmRate)} per km = <B>{inr((calc.extraKm ?? 0) * kmRate)}</B>
            </Calc>
          )}
        </>
      )}

      {isRental && (
        <>
          <SectionLabel>Extra hours</SectionLabel>
          <Row>
            <Input label="Start time" placeholder="HH:MM" value={v.start_time} onChangeText={on('start_time')} />
            <Input label="End time" placeholder="HH:MM" value={v.end_time} onChangeText={on('end_time')} />
          </Row>
          {calc.usedMin !== undefined && (
            <Calc>
              Used{' '}
              <B>
                {Math.floor(calc.usedMin / 60)} hr {calc.usedMin % 60} min
              </B>
              . Package time {calc.pkgMin / 60} hr. Extra <B>{calc.extraMin} min</B> at {inr(hrRate)} per hr ={' '}
              <B>{inr(((calc.extraMin ?? 0) / 60) * hrRate)}</B>
            </Calc>
          )}
        </>
      )}

      {!isAirport && (
        <>
          <SectionLabel>{isRental ? 'Toll and allowance' : 'Toll'}</SectionLabel>
          <Row>
            <Input label="Toll paid (₹)" keyboardType="number-pad" value={v.toll} onChangeText={on('toll')} />
            {isRental ? (
              <Input
                label="Driver allowance (₹)"
                keyboardType="number-pad"
                value={v.allowance}
                onChangeText={on('allowance')}
              />
            ) : (
              <Input
                label="Extra toll (₹)"
                keyboardType="number-pad"
                value={v.extra_toll}
                onChangeText={on('extra_toll')}
              />
            )}
          </Row>
          <PhotoBtn label="Add toll receipts" files={receipts} set={setReceipts} />
        </>
      )}

      {!isRental && (
        <>
          <SectionLabel>Waiting{isAirport ? '' : ' time'}</SectionLabel>
          <Input
            label="Waiting time (min)"
            keyboardType="number-pad"
            value={v.waiting_min}
            onChangeText={on('waiting_min')}
          />
          <Muted style={{ marginTop: -6, marginBottom: 8 }}>{freeWait} min free. Then ₹2 per min.</Muted>
          {isAirport && calc.wait !== undefined && (
            <Calc>
              Waited <B>{calc.wait} min</B>. Free {freeWait} min. Extra <B>{calc.extraWait} min</B> ={' '}
              <B>{inr((calc.extraWait ?? 0) * 2)}</B>
            </Calc>
          )}
        </>
      )}

      {isAirport && (
        <>
          <SectionLabel>Extra distance</SectionLabel>
          <Input label="Extra km (if any)" keyboardType="number-pad" value={v.extra_km} onChangeText={on('extra_km')} />
        </>
      )}

      {!isRental && !isAirport && (
        <>
          <SectionLabel>Driver allowance</SectionLabel>
          <Input
            label="Driver allowance (₹)"
            keyboardType="number-pad"
            value={v.allowance}
            onChangeText={on('allowance')}
          />
          <Muted style={{ marginTop: -6 }}>Stay and food included</Muted>
        </>
      )}

      {!isAirport && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 12,
            marginTop: 16,
          }}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontWeight: '700' }}>Night charge</Text>
            <Muted>AOLO adds this only if the ride runs between 12:00 AM and 3:30 AM</Muted>
          </View>
          <Pill text="Locked" />
        </View>
      )}
    </Screen>
  );
}

const B = ({ children }: { children: React.ReactNode }) => <Text style={{ fontWeight: '800' }}>{children}</Text>;
